# Tooling and SDK

## Purpose

Compact 契約と TypeScript アプリの接続、wallet 連携、proof server 運用の実務手順を整理する。

## Core Components

- `@midnight-ntwrk/compact-runtime`
- Compact 生成 TypeScript の実行基盤
- `midnight.js`
- Midnight ネットワーク向け JavaScript/TypeScript SDK
- Wallet interfaces
- Wallet SDK または Wallet API を使った証明・送信フロー

## Integration Workflow

1. Compact 変更後、生成物を再作成する。
2. 生成 TypeScript と `compact-runtime` の整合を確認する。
3. wallet 連携層でネットワーク設定（network ID / endpoint）を注入する。
4. proof server 設定を環境変数化する。
5. 最小トランザクションで prove -> submit の疎通確認を行う。

## Wallet API Flow (Reference)

Wallet Developer Guide では以下の API 群が示される。

- `wallet.balanceAndProveTransaction(...)`
- `wallet.submitTransaction(...)`
- `wallet.proveTransaction(...)`
- `wallet.transferTransaction(...)`

実装方針:
- 送信前に残高・手数料・必要リソースを評価する。
- `prove` と `submit` を分離し、失敗点を切り分け可能にする。
- 取引 ID と関連ログを必ず記録し、追跡可能性を持たせる。

## Proof Server Operations

- local/testnet/devnet で接続先を切り替える。
- タイムアウトを明示し、無限待機を避ける。
- 一時障害には限定リトライ（指数バックオフ）を使う。

確認項目:
- endpoint 到達可能性
- network ID 整合
- 証明生成負荷と待ち時間

## Troubleshooting Matrix

### Symptom: proof generation fails

確認順序:
1. proof server URL
2. network ID
3. 契約/生成物のバージョン差異
4. 入力値の制約違反

### Symptom: submit fails after prove success

確認順序:
1. 署名対象データ整合
2. 残高/手数料
3. ノード側一時障害
4. 再送ポリシー重複

### Symptom: wallet state mismatch

確認順序:
1. 同期タイミング
2. serialize/restore ロジック
3. 並列処理時の競合

## Operational Guardrails

- 秘密情報は環境変数で管理し、ログへ出さない。
- 障害時ログは機密情報をマスクする。
- 生成物更新漏れを防ぐため、CI で差分検知を検討する。

## Official Links

- Docs Home: https://docs.midnight.network/
- Getting Started / Prerequisites: https://docs.midnight.network/develop/tutorial/using/getting-started
- Wallet Developer Guide: https://docs.midnight.network/develop/tutorial/using/wallet-developer-guide
- API Reference: https://docs.midnight.network/develop/reference/api-reference
- Compact Runtime: https://www.npmjs.com/package/@midnight-ntwrk/compact-runtime
- Midnight.js: https://github.com/input-output-hk/midnight-js
