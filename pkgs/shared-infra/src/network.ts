export type SupportedNetwork = "standalone" | "testnet-local" | "testnet" | "testnet-remote";

export interface ProviderConfig {
  indexer: string;
  indexerWS: string;
  node: string;
  proofServer: string;
  networkId: "TestNet" | "Undeployed";
}

/**
 * ネットワーク名を環境変数から選択する
 * NEXTMED_NETWORK が未設定の場合は defaultNetwork を使用
 */
export function selectNetworkFromEnv(defaultNetwork: SupportedNetwork = "testnet-remote"): SupportedNetwork {
  const env: string | undefined = process.env.NEXTMED_NETWORK;
  if (env === "standalone" || env === "testnet-local" || env === "testnet" || env === "testnet-remote") {
    return env;
  }
  if (env === "testnet") return "testnet-remote";
  return defaultNetwork;
}

/**
 * ネットワークごとの標準 Provider 設定を構築する
 */
export function buildProviderConfig(network: SupportedNetwork, overrides?: Partial<ProviderConfig>): ProviderConfig {
  let base: ProviderConfig;
  switch (network) {
    case "standalone":
      base = {
        indexer: "http://127.0.0.1:8088/api/v1/graphql",
        indexerWS: "ws://127.0.0.1:8088/api/v1/graphql/ws",
        node: "http://127.0.0.1:9944",
        proofServer: "http://127.0.0.1:6300",
        networkId: "Undeployed",
      };
      break;
    case "testnet-local":
      base = {
        indexer: "http://127.0.0.1:8088/api/v1/graphql",
        indexerWS: "ws://127.0.0.1:8088/api/v1/graphql/ws",
        node: "http://127.0.0.1:9944",
        proofServer: "http://127.0.0.1:6300",
        networkId: "TestNet",
      };
      break;
    case "testnet":
    case "testnet-remote":
    default:
      base = {
        indexer: "https://indexer.testnet-02.midnight.network/api/v1/graphql",
        indexerWS: "wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws",
        node: "https://rpc.testnet-02.midnight.network",
        proofServer: "http://127.0.0.1:6300",
        networkId: "TestNet",
      };
      break;
  }
  return { ...base, ...overrides };
}

/**
 * 環境変数で上書き可能な Provider 設定を返す
 * INDEXER_URL, INDEXER_WS_URL, NODE_URL, PROOF_SERVER_URL で上書き
 */
export function getProviderConfigFromEnv(defaultNetwork: SupportedNetwork = "testnet-remote"): ProviderConfig {
  const network: SupportedNetwork = selectNetworkFromEnv(defaultNetwork);
  const overrides: Partial<ProviderConfig> = {
    indexer: process.env.INDEXER_URL,
    indexerWS: process.env.INDEXER_WS_URL,
    node: process.env.NODE_URL,
    proofServer: process.env.PROOF_SERVER_URL,
  };
  return buildProviderConfig(network, Object.fromEntries(
    Object.entries(overrides).filter(([_, v]) => typeof v === "string" && v.length > 0),
  ) as Partial<ProviderConfig>);
}

