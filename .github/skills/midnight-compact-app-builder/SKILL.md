---
name: midnight-compact-app-builder
description: Midnight（Cardanoサイドチェーン）上でのCompactスマートコントラクトとDAppを設計・実装・検証・デプロイまで一貫支援する。Compact契約設計、TypeScript生成物統合、Wallet API/Wallet SDK連携、proof server運用、testnet/devnet接続、失敗解析が必要な依頼で使用する。
---

# Midnight Compact App Builder

Midnight DApp 開発を、要件整理から障害対応までエンドツーエンドで進める。

## Start Here

1. まず現在のコードベースを調査し、既存の Compact 契約・TypeScript クライアント・環境変数・ネットワーク設定を把握する。
2. 不足情報を最小限で確認する。特に以下が不明なら優先して確認する。
- 対象ネットワーク（local / testnet / devnet）
- 使用ウォレット方式（Wallet SDK or Wallet API）
- proof server の接続先
- 既存コントラクト有無（新規作成か改修か）
3. 実装前に作業計画を短く提示し、契約設計とアプリ統合の境界を明確にする。
4. 実装時は TDD を基本とし、失敗ケースのテストを必ず含める。
5. 完了時は「変更内容・検証結果・残リスク・次アクション」を簡潔に報告する。

## Delivery Workflow

### 1) Discovery
- プロジェクト構成を確認し、以下を探す。
- Compact ソース
- 生成済み TypeScript 出力
- wallet 連携コード
- proof server / network 設定
- 既存テスト
- 実行コマンドを特定する（install, build, test, lint, run）。
- 開発対象を「契約中心」「クライアント中心」「両方」に分類する。

### 2) Design
- 公開データと秘匿データを分離し、最小公開を原則に設計する。
- witness の責務と検証ポイントを明示する。
- 回路の境界条件とエラー条件を先に列挙し、テストケースへ落とし込む。
- 外部公開 API（UI/Backend から呼ばれる層）は、入力検証と例外方針を決めてから実装する。

### 3) Implement
- Compact の型・状態遷移・回路ロジックを先に安定化させる。
- 生成 TypeScript を統合し、wallet 連携を段階的に接続する。
- 環境依存値（network ID, endpoint, secrets）はハードコードしない。
- 既存コードスタイルに従い、重複は小さなヘルパーに集約する。

### 4) Verify
- 正常系だけでなく、以下の失敗系を必ず確認する。
- proof 生成失敗
- ネットワーク不一致
- 残高不足/資源不足
- 不正入力
- ステート非整合
- 契約テストと統合テストを分離して実行し、失敗時の再現手順を記録する。

### 5) Deploy / Operate
- デプロイ先ネットワークと資金（テストトークン含む）を確認する。
- ロールバック・再実行の手順を明確にしてから反映する。
- 運用時はログとトランザクション追跡情報を残し、障害解析可能性を担保する。

## Quality Gates

- 機密情報は環境変数で管理し、コードやログに露出させない。
- 例外は握りつぶさず、原因が追えるメッセージにする。
- リトライが必要な処理は対象を限定し、指数バックオフ方針を定義する。
- 仕様変更時は関連テストを同時更新し、古い挙動を暗黙に残さない。

## Troubleshooting Priority

1. 環境不整合（network ID / endpoint / proof server URL）
2. 生成物不整合（契約変更後に生成物が古い）
3. 回路制約違反（型・witness・遷移条件）
4. ウォレット連携不備（状態同期、署名、送信順序）
5. 外部依存の一時障害（ネットワークやノードの遅延）

## Required References

必要な箇所だけ読むこと。

- 全体像・環境前提: `references/fundamentals.md`
- Compact 設計と実装: `references/compact-language.md`
- SDK/API/運用: `references/tooling-and-sdk.md`

## Official Sources

- Midnight Docs: https://docs.midnight.network/
- Wallet Developer Guide: https://docs.midnight.network/develop/tutorial/using/wallet-developer-guide
- API Reference Index: https://docs.midnight.network/develop/reference/api-reference
- Compact Runtime Package: https://www.npmjs.com/package/@midnight-ntwrk/compact-runtime
- Midnight.js SDK: https://github.com/input-output-hk/midnight-js
