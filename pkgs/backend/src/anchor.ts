import { getProviderConfigFromEnv } from "shared-infra/network";
import { Counter } from "contract";
import { WalletBuilder, type Resource } from "@midnight-ntwrk/wallet";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import {
  type BalancedTransaction,
  type MidnightProvider,
  type UnbalancedTransaction,
  type WalletProvider,
} from "@midnight-ntwrk/midnight-js-types";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { Transaction, type TransactionId } from "@midnight-ntwrk/ledger";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import * as path from "node:path";

const PRIVATE_STATE_STORE = "counter-private-state";

const createWalletAndMidnightProvider = async (
  wallet: any,
): Promise<WalletProvider & MidnightProvider> => {
  const state = await (wallet as any).state().toPromise();
  return {
    coinPublicKey: state.coinPublicKey,
    encryptionPublicKey: state.encryptionPublicKey,
    async balanceTx(tx: UnbalancedTransaction): Promise<BalancedTransaction> {
      const zswapTx = await wallet.proveTransaction(
        ZswapTransaction.deserialize(
      const zswapTx = await (wallet as any).proveTransaction(
          getZswapNetworkId(),
        ),
      );
      const balanced = Transaction.deserialize(
        zswapTx.serialize(getZswapNetworkId()),
        getLedgerNetworkId(),
      );
      return {
        ...tx,
        serialize: () => balanced.serialize(getLedgerNetworkId()),
      } as unknown as BalancedTransaction;
    },
    submitTx(tx: BalancedTransaction): Promise<TransactionId> {
      return wallet.submitTransaction(tx);
    },
      return (wallet as any).submitTransaction(tx);
};

export type AnchorResult = {

export type AnchorResult = {
  txId: string;
  blockHeight: number;
  lastAnchor: bigint | null;
};

export const performAnchor = async (
  logger: Pick<Console, "log" | "error">,
  contractAddressHex: string,
  hashField: bigint,
): Promise<AnchorResult> => {
  const seed = process.env.SEED_ENV_VAR;
  if (!seed) {
    throw new Error("SEED_ENV_VAR is required to perform real anchor");
  }
  const cfg = getProviderConfigFromEnv();
  const wallet: any & Resource = await WalletBuilder.buildFromSeed(
    cfg.indexer,
    cfg.indexerWS,
    cfg.proofServer,
    cfg.node,
    seed,
    getZswapNetworkId(),
    "info",
  );
  (wallet as any).start();
  const walletAndMidnightProvider =
    await createWalletAndMidnightProvider(wallet);
  const zkConfigPath = path.resolve(
    process.cwd(),
    "pkgs",
    "contract",
    "src",
    "managed",
    "counter",
  );
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: PRIVATE_STATE_STORE,
    }),
    publicDataProvider: indexerPublicDataProvider(cfg.indexer, cfg.indexerWS),
    zkConfigProvider: new NodeZkConfigProvider<"increment" | "anchor">(
      zkConfigPath,
    ),
    proofProvider: httpClientProofProvider(cfg.proofServer),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };
  const contract = new (Counter as any).Contract({});
  const counterContract = await findDeployedContract(providers as any, {
    contractAddress: contractAddressHex,
    contract,
    privateStateId: "counterPrivateState",
    initialPrivateState: { privateCounter: 0 },
  });
  const finalizedTxData = await (counterContract.callTx as any).anchor(
    hashField,
  );
  const state = await providers.publicDataProvider
    .queryContractState(counterContract.deployTxData.public.contractAddress)
    .then((s) =>
      s != null ? ((Counter as any).ledger(s.data) as any).lastAnchor : null,
    );
  await (wallet as any).close().catch(() => {});
  return {
    txId: finalizedTxData.public.txId,
    blockHeight: finalizedTxData.public.blockHeight,
    lastAnchor: state as bigint | null,
  };
};
