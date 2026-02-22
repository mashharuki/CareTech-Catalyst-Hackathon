// SPDX-License-Identifier: Apache-2.0
import type { Logger } from "pino";
import { createLogger } from "../src/utils/logger-utils.js";
import {
  StandaloneConfig,
  TestnetLocalConfig,
  TestnetRemoteConfig,
  type Config,
} from "../src/config.js";
import * as api from "../src/api.js";
import { assertIsContractAddress } from "@midnight-ntwrk/midnight-js-utils";
import * as dotenv from "dotenv";
import { assertAuthorized, loadAuthzContextFromEnv } from "shared-infra/authz";

dotenv.config();

type SupportedNetwork =
  | "standalone"
  | "testnet-local"
  | "testnet"
  | "testnet-remote";

const {
  NETWORK_ENV_VAR,
  SEED_ENV_VAR,
  CONTRACT_ADDRESS,
  CACHE_FILE_ENV_VAR,
  ANCHOR_HASH_HEX,
} = process.env;

const resolveNetwork = (value: string | undefined): SupportedNetwork => {
  const normalized = (value ?? "testnet").toLowerCase();
  if (normalized === "testnet") {
    return "testnet";
  }
  switch (normalized) {
    case "testnet-remote":
    case "standalone":
    case "testnet-local":
      return normalized;
    default:
      throw new Error(`Unsupported network '${value}'.`);
  }
};

const buildConfig = (network: SupportedNetwork): Config => {
  switch (network) {
    case "standalone":
      return new StandaloneConfig();
    case "testnet-local":
      return new TestnetLocalConfig();
    case "testnet":
    case "testnet-remote":
    default:
      return new TestnetRemoteConfig();
  }
};

const ensureSeed = (seed: string | undefined): string => {
  if (seed === undefined || seed.trim() === "") {
    throw new Error("Wallet seed is required. Set SEED_ENV_VAR.");
  }
  return seed.trim();
};

const ensureContractAddress = (address: string | undefined): string => {
  if (address === undefined || address.trim() === "") {
    throw new Error("Contract address is required. Set CONTRACT_ADDRESS.");
  }
  const trimmed = address.trim();
  assertIsContractAddress(trimmed);
  return trimmed;
};

const ensureAnchorHash = (hex: string | undefined): bigint => {
  if (hex === undefined || hex.trim() === "") {
    throw new Error(
      "Anchor hash is required. Set ANCHOR_HASH_HEX to 0x-prefixed hex.",
    );
  }
  const trimmed = hex.trim();
  const normalized = trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
  return BigInt(normalized);
};

let logger: Logger | undefined;

const main = async () => {
  assertAuthorized(loadAuthzContextFromEnv("system"), ["ops:invoke"]);
  const network = resolveNetwork(NETWORK_ENV_VAR);
  const seed = ensureSeed(SEED_ENV_VAR);
  const contractAddress = ensureContractAddress(CONTRACT_ADDRESS);
  const hashField: bigint = ensureAnchorHash(ANCHOR_HASH_HEX);
  const cacheFileName =
    CACHE_FILE_ENV_VAR ?? `${seed.substring(0, 8)}-${network}.state`;

  const config = buildConfig(network);
  logger = await createLogger(config.logDir);
  api.setLogger(logger);

  logger.info(`Anchoring on '${network}' network.`);
  logger.info(`Target contract address: ${contractAddress}`);
  logger.info(`Using cache file '${cacheFileName}'.`);

  let wallet:
    | Awaited<ReturnType<typeof api.buildWalletAndWaitForFunds>>
    | undefined;
  let providers: Awaited<ReturnType<typeof api.configureProviders>> | undefined;
  try {
    wallet = await api.buildWalletAndWaitForFunds(config, seed, cacheFileName);
    providers = await api.configureProviders(wallet, config);
    const counterContract = await api.joinContract(providers, contractAddress);
    const txInfo = await api.anchor(counterContract, hashField);
    logger.info(
      `Anchor transaction: ${txInfo.txId} (block ${txInfo.blockHeight})`,
    );
    console.log(`Anchored. txId=${txInfo.txId} block=${txInfo.blockHeight}`);
    const last = await api.getLastAnchorField(providers, contractAddress);
    if (last !== null) {
      logger.info(`Last anchor field: ${last.toString(16)}`);
      console.log(`Last anchor field: 0x${last.toString(16)}`);
    }
    await api.saveState(wallet, cacheFileName);
  } finally {
    if (providers !== undefined) {
      const res = providers.privateStateProvider as unknown as {
        close?: () => unknown;
      };
      if (typeof res?.close === "function") {
        try {
          await Promise.resolve(res.close());
        } catch {
          /* noop */
        }
      }
    }
    if (wallet !== undefined) {
      const res = wallet as unknown as { close?: () => unknown };
      if (typeof res?.close === "function") {
        try {
          await Promise.resolve(res.close());
        } catch {
          /* noop */
        }
      }
    }
  }
};

await main().catch((error) => {
  if (logger !== undefined) {
    if (error instanceof Error) {
      logger.error(`Anchor failed: ${error.message}`);
      logger.debug(error.stack ?? "");
    } else {
      logger.error(`Anchor failed: ${String(error)}`);
    }
  } else {
    console.error(error);
  }
  process.exitCode = 1;
});
