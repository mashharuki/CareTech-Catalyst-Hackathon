---
name: midnight-compact-app-builder
description: Compact言語とMidnightのSDKエコシステム（Wallet SDK/API、compact-runtime、proof server、testnet/devnet）を使ったDAppの設計・実装・テスト・デプロイを包括支援する。Compactスマートコントラクトの作成、TypeScript出力の統合、ウォレット連携、証明生成やネットワーク接続、障害対応が必要な場面で使用する。
---

# Midnight Compact App Builder

## Overview
- Midnight DApp開発に必要な設計、Compact実装、TypeScript統合、Proof Server運用、ネットワーク検証までを一貫支援する

## Workflow Decision Tree
- 契約設計やプライバシーモデルの相談 → Contract Design
- Compact実装やコンパイル出力の扱い → Build Outputs
- TypeScriptアプリ連携やWallet操作 → SDK Integration
- 証明生成、ネットワーク、テスト、デプロイ → Proof Server & Network / Testing & Deployment
- エラーや不具合の解析 → Troubleshooting

## Quick Start
1. リポジトリ構造とビルドツールを特定する
2. Proof Serverの稼働を確認する
3. Compactコントラクトの設計と実装を行う
4. コンパイル結果のTypeScript出力をアプリに統合する
5. 単体テストとネットワーク検証を実行する

## Contract Design
- 公開状態とプライベート状態を分離し、witnessを明確化する
- circuit関数は引数と戻り値の型を明示する
- 選択的開示の最小化を優先し、公開する事実を絞る
- 詳細は references/compact-language.md と references/fundamentals.md を参照する
- リポジトリ内に docs/compact があれば併せて参照する

## Build Outputs
- Compactのコンパイルで keys/ と zkir/、TypeScript出力が生成されることを前提に進める
- TypeScript出力は compact-runtime への依存があるため、導入状況を確認する
- 詳細は references/compact-language.md と references/tooling-and-sdk.md を参照する

## SDK Integration
- Wallet APIの balance/prove/submit/transfer を中心にトランザクションフローを構築する
- Wallet SDKとWallet APIのどちらを使うかをアプリ要件で選択する
- TypeScript出力のネットワークID設定やProof Server連携を忘れない
- 詳細は references/tooling-and-sdk.md を参照する

## Proof Server & Network
- ローカルProof Serverとtestnet/devnetのどちらを使うかを明確化する
- Proof ServerのURLとネットワークIDは環境設定に集約する
- 詳細は references/tooling-and-sdk.md を参照する

## Testing & Deployment
- Compact単体テストとTypeScript統合テストを分離して実行する
- testnet/devnetではtDUSTなどのテスト用トークン確保を前提にする
- 重要なフローはリポジトリの既存スクリプトやCLIに統合する

## Troubleshooting
- 証明生成失敗はProof Server稼働とネットワークIDを最優先で確認する
- 回路の型エラーはCompact型定義とwitnessの整合を確認する
- ウォレット同期不備はstate/serializeStateと履歴の整合を確認する

## References
- references/fundamentals.md
- references/compact-language.md
- references/tooling-and-sdk.md
