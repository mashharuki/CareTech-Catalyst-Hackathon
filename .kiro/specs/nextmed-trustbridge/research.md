# Research & Design Decisions

## Summary

- **Feature**: `nextmed-trustbridge`
- **Discovery Scope**: Complex Integration (brownfield)
- **Requirements Approval Status**: 未承認（`approvals.requirements.approved = false`）
- **Key Findings**:
  - 既存実装は `Counter` 例題中心で、医療連携ドメイン（参加者/同意/監査）の永続モデルが未実装。
  - `contract` + `cli` の実行・テスト基盤は再利用可能だが、現状は `increment` 1操作に特化。
  - `frontend` は Vite 初期テンプレートで、業務UI/ワークフローはゼロベースで構築が必要。
  - 外部依存障害に対するログ基盤はあるが、業務的な再試行ポリシー・保留状態管理は不足。

## Current State Investigation

### Existing Assets

- `pkgs/contract/src/counter.compact`: 公開状態 `round` と `increment()` のみ。
- `pkgs/cli/src/api.ts`: デプロイ、参加、`increment`、ウォレット同期、状態保存を提供。
- `pkgs/cli/src/cli.ts`: 対話的 CLI（deploy/join/increment/display）。
- `pkgs/cli/src/test/*.ts`, `pkgs/contract/src/test/*.ts`: コントラクト/API の振る舞いテスト基盤あり。
- `pkgs/frontend/src/App.tsx`: テンプレートUIのみ（業務コンポーネントなし）。

### Conventions / Constraints

- モノレポ + `pnpm` ワークスペース、責務分離は `contract` / `cli` / `frontend`。
- TypeScript ESM、Compact コントラクト、Vitest ベース。
- 既存ドメイン型は `counter` 依存が強く、公開 API も同名で固定化。
- 永続化はウォレット同期キャッシュ中心で、業務監査用ストアは未導入。

### Integration Surfaces

- Blockchain 側: Compact contract + Midnight providers (`indexer`, `proofServer`, `wallet`)。
- 実行環境: `standalone.yml` / `proof-server-*.yml`。
- UI連携: なし（API層とフロントの接続インターフェース未定義）。

## Requirement-to-Asset Map (Gap Tag: Missing / Unknown / Constraint)

| Requirement | Existing Asset | Gap Tag | Gap Detail |
|---|---|---|---|
| 1. 参加者登録と信頼済み主体管理 | `counter` の単一状態遷移のみ | Missing | 参加主体モデル、信頼レベル、状態遷移履歴、管理 API が存在しない |
| 2. 患者同意と利用目的制御 | なし | Missing | 同意スキーマ、有効期間/撤回、条件照合ロジックが未実装 |
| 3. 連携要求と受け渡し判定 | `deploy/join/increment` のみ | Missing | 連携要求モデル、判定エンジン、追跡ID、通知インターフェースが未実装 |
| 4. 監査証跡と信頼検証 | `pino` ログは存在 | Constraint | ログはあるが、監査検索可能な構造化イベントストア/改変検知機構がない |
| 5. 障害時継続性と可観測性 | ウォレット同期待機・例外ログ | Constraint | ドメイン単位の保留状態、再試行方針、SLOメトリクス集計が不足 |
| 全要件共通: UI/運用画面 | `frontend` テンプレート | Missing | 参加者管理、同意管理、判定状況、監査検索の UI がない |
| 外部監査連携形式 | 未調査 | Unknown | 監査証跡の標準形式（例: JSON署名、ハッシュ連鎖）要件が未確定 |

## Requirements Feasibility Analysis

### Technical Needs Derived from Requirements

- **Data Models**: Participant, Consent, AccessRequest, Decision, AuditEvent, RetryQueue。
- **Domain Services**: 同意条件判定、信頼レベル評価、要求状態遷移、監査イベント生成。
- **Interfaces**: 管理 API（CLI/将来HTTP）、操作 UI、外部監査出力。
- **Non-functional**: 監査完全性、失敗時安全側判定、リトライ、トレーサビリティ。

### Complexity Signals

- 単純 CRUD ではなく、条件判定 + ワークフロー + 外部依存（Wallet/Indexer/Proof Server）を伴う。
- 既存 `counter` から医療連携ドメインへ大幅拡張が必要。

## Implementation Approach Options

### Option A: Extend Existing Components

- **Extend targets**:
  - `pkgs/contract/src/counter.compact` を医療連携ロジックへ拡張。
  - `pkgs/cli/src/api.ts` に participant/consent/request/audit 操作を追加。
  - `pkgs/frontend/src/App.tsx` を単一画面で段階拡張。
- **Pros**:
  - 既存ビルド/テスト/デプロイ導線を最大活用。
  - 初期立ち上がりが最速。
- **Cons**:
  - `counter` 依存命名と責務肥大化で保守性低下。
  - 監査・同意判定の境界が曖昧化しやすい。

### Option B: Create New Components

- **New creation**:
  - `pkgs/contract/src/trustbridge.compact`（新ドメイン契約）。
  - `pkgs/cli/src/trustbridge/*`（participant/consent/request/audit サービス層）。
  - `pkgs/frontend/src/pages/trustbridge/*`（用途別画面）。
- **Pros**:
  - 境界明確、テスト独立性高い、将来機能追加に強い。
  - `counter` サンプルを残しつつ新機能を分離可能。
- **Cons**:
  - 新規ファイル増加とインターフェース設計コスト。
  - 初期設計負荷が大きい。

### Option C: Hybrid Approach

- **Combination**:
  - Phase 1: `cli` にアプリケーション層（同意判定/監査イベント）を新設し、契約は最小拡張。
  - Phase 2: `trustbridge.compact` へ段階移行し、`counter` 互換パスを維持。
- **Pros**:
  - リスク分散しつつ実装を前進。
  - 既存資産再利用と責務分離のバランスが良い。
- **Cons**:
  - 期間中に二重モデル管理が発生。
  - 移行計画を設計で厳密化しないと整合性崩壊リスク。

## Effort & Risk

- **Effort**: `L`（1–2 weeks）
  - 理由: 新ドメインモデル、判定ロジック、監査基盤、UI追加、統合テストが必要。
- **Risk**: `High`
  - 理由: 同意/監査の仕様境界が未確定で、外部監査連携形式とオンチェーン責務分担に未知数がある。

## Recommendations for Design Phase

- **Preferred direction (for evaluation)**: Option C（Hybrid）
  - 初期は既存実行基盤を活かしつつ、最終的に責務分離された新ドメインへ移行する設計が妥当。
- **Key design decisions to make**:
  1. どこまでをオンチェーン（改ざん耐性）に置き、どこまでをオフチェーン（検索性）に置くか。
  2. 同意判定ルールの正規化方式（利用目的・データ種別・期間・撤回の優先順位）。
  3. 監査証跡の不変性担保（ハッシュ連鎖/署名/外部保存）の採用方式。
  4. リトライ/保留/不承認の状態機械と安全側判定ポリシー。

## Research Needed

1. 監査証跡の外部連携フォーマットと検証要件（規制・監査運用前提）。
2. 医療データ同意モデルの最小必須属性（データ種別粒度、代理権限、部分撤回）。
3. Midnight/Compact でのイベント表現とオフチェーン検索連携のベストプラクティス。
4. 可観測性指標の定義（成功率、遅延、失敗分類）と運用閾値。
