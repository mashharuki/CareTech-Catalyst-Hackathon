# Fundamentals

## Scope

このリファレンスは Midnight 開発の初動で必要な共通知識をまとめる。

## Platform Model

- Midnight は Cardano サイドチェーンとして、機密性重視のスマートコントラクト実行を提供する。
- 開発の中心要素は以下。
- Compact（コントラクト言語）
- 証明生成基盤（proof server）
- クライアント SDK（midnight.js, compact-runtime, wallet interfaces）
- 実行環境（local / testnet / devnet）

## Environment Prerequisites

Midnight Docs の Getting Started で確認する。

- Git
- Node.js 20 以上
- Docker（ローカルノードや proof server を扱う場合）
- ブラウザウォレット拡張を使う場合は Chromium 系ブラウザ
- Bun を使う手順が案内されるため、未導入ならセットアップする

Bun 導入例（公式ガイド記載）:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Network Selection Heuristics

- `local`: 最速検証。回路・統合フローの試行錯誤に使う。
- `testnet`: 外部連携・共有テスト向け。実運用に近い事前検証。
- `devnet`: 試験中機能や検証目的の確認向け。

判断基準:
- 開発速度優先なら local
- チーム検証やデモ準備なら testnet
- 特定機能検証要件があるなら devnet

## Standard Delivery Artifacts

タスク完了時に最低限残すべき成果物:

- 変更ファイル一覧（契約・生成物・アプリコード）
- 実行した検証コマンド
- テスト結果（正常/異常）
- 既知の未解決リスク
- 次に実施すべき運用手順

## Common Failure Domains

- 環境変数不足・誤設定
- network ID と endpoint の不一致
- proof server 接続不可
- 生成済み TypeScript が古い
- ウォレット状態同期の欠落

障害時は上から順に潰すと復旧が早い。
