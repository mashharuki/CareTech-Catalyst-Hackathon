// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  NetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import path from "node:path";
import { buildProviderConfig } from "shared-infra/network";
export const currentDir = path.resolve(new URL(import.meta.url).pathname, "..");

export const contractConfig = {
  privateStateStoreName: "counter-private-state",
  zkConfigPath: path.resolve(
    currentDir,
    "..",
    "..",
    "contract",
    "src",
    "managed",
    "counter",
  ),
};

export interface Config {
  readonly logDir: string;
  readonly indexer: string;
  readonly indexerWS: string;
  readonly node: string;
  readonly proofServer: string;
}

export class TestnetLocalConfig implements Config {
  logDir: string = path.resolve(
    currentDir,
    "..",
    "logs",
    "testnet-local",
    `${new Date().toISOString()}.log`,
  );
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  constructor() {
    const cfg = buildProviderConfig("testnet-local");
    this.indexer = cfg.indexer;
    this.indexerWS = cfg.indexerWS;
    this.node = cfg.node;
    this.proofServer = cfg.proofServer;
    setNetworkId(
      cfg.networkId === "TestNet" ? NetworkId.TestNet : NetworkId.Undeployed,
    );
  }
}

export class StandaloneConfig implements Config {
  logDir: string = path.resolve(
    currentDir,
    "..",
    "logs",
    "standalone",
    `${new Date().toISOString()}.log`,
  );
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  constructor() {
    const cfg = buildProviderConfig("standalone");
    this.indexer = cfg.indexer;
    this.indexerWS = cfg.indexerWS;
    this.node = cfg.node;
    this.proofServer = cfg.proofServer;
    setNetworkId(
      cfg.networkId === "TestNet" ? NetworkId.TestNet : NetworkId.Undeployed,
    );
  }
}

export class TestnetRemoteConfig implements Config {
  logDir: string = path.resolve(
    currentDir,
    "..",
    "logs",
    "testnet-remote",
    `${new Date().toISOString()}.log`,
  );
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  constructor() {
    const cfg = buildProviderConfig("testnet-remote");
    this.indexer = cfg.indexer;
    this.indexerWS = cfg.indexerWS;
    this.node = cfg.node;
    this.proofServer = cfg.proofServer;
    setNetworkId(
      cfg.networkId === "TestNet" ? NetworkId.TestNet : NetworkId.Undeployed,
    );
  }
}
