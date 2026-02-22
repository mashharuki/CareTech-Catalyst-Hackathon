# Research & Design Decisions

## Summary

- **Feature**: `nextmed-trustbridge`
- **Discovery Scope**: Complex Integration
- **Key Findings**:
  - 既存コードは `counter` の最小サンプルに集中しており、参加者・同意・監査のドメインモデルと永続化層が未実装。
  - Midnight の Wallet API/SDK と Proof Server 運用は既存 `cli` に基盤があるため再利用可能。
  - 同意モデルと監査証跡は医療標準との整合が重要で、設計段階でオンチェーン/オフチェーン分担を明確化する必要がある。

## Research Log

### Midnight SDK・ネットワーク運用の再利用範囲

- **Context**: 要件 3, 5 の連携判定・障害時継続性の設計根拠が必要。
- **Sources Consulted**:
  - https://docs.midnight.network/
  - https://www.npmjs.com/package/@midnight-ntwrk/wallet-api
  - https://www.npmjs.com/package/@midnight-ntwrk/wallet
- **Findings**:
  - Wallet API は状態取得・トランザクション証明/送信の抽象を提供し、SDK 側が実装する構造。
  - リポジトリ既存実装（`pkgs/cli/src/api.ts`）に wallet 同期、prove/submit、proof provider 接続の導線が存在。
  - 既存の `standalone.yml` / `proof-server-*.yml` により local/testnet 切替の運用資産がある。
- **Implications**:
  - 要件 3, 5 は既存 `cli` 基盤を拡張して達成可能。
  - 設計では `counter` 固有 API を `trustbridge` ドメイン API に抽象化する必要がある。

### 同意モデルの標準整合

- **Context**: 要件 2 の同意範囲、目的、部分撤回の定義を曖昧にしないため。
- **Sources Consulted**:
  - https://www.hl7.org/fhir/consent.html
  - https://www.hl7.org/fhir/R5/consent-definitions.html
- **Findings**:
  - FHIR Consent は grantor/grantee、purpose、security label、provision による条件表現を持つ。
  - 目的外利用を防ぐため、purpose と対象データ種別を判定条件として保持する構造が妥当。
- **Implications**:
  - `ConsentPolicy` を「目的・対象データ・期間・撤回状態」の組み合わせで設計する。
  - 部分撤回を「provision 単位の無効化」として扱う状態モデルが必要。

### 可観測性・エラーメトリクス

- **Context**: 要件 5 の運用メトリクスと障害可視化の定義が必要。
- **Sources Consulted**:
  - https://opentelemetry.io/docs/specs/semconv/http/http-metrics/
  - https://opentelemetry.io/docs/specs/semconv/general/metrics/
- **Findings**:
  - HTTP 監視では `http.server.request.duration` 等の低カーディナリティ指標を軸にするのが推奨。
  - `error.type` は低カーディナリティを維持する設計が必要。
- **Implications**:
  - 運用メトリクスは「成功率・遅延・エラー種別」を固定語彙で集計する。
  - 高カーディナリティ値（raw message 等）を主要メトリクスラベルに使わない。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
| --- | --- | --- | --- | --- |
| A: Extend Existing | `counter` 契約/CLI/UI を直接拡張 | 実装開始が速い | 既存責務が肥大化し境界が不明瞭 | 初期 PoC 向き |
| B: New Components | `trustbridge` ドメインを新規で分離 | 保守性・テスト独立性が高い | 立ち上げコストが高い | 長期最適 |
| C: Hybrid | Phase 1 で CLI/オフチェーン層を新設、Phase 2 で契約分離 | リスク分散し段階移行可能 | 移行期間の二重管理が発生 | 現状に最適 |

## Design Decisions

### Decision: ハイブリッド境界（Option C）を採用

- **Context**: 既存資産活用と将来拡張性を両立する必要がある。
- **Alternatives Considered**:
  1. Option A — 既存 `counter` 拡張中心
  2. Option B — 新規分離を一括実施
- **Selected Approach**: Option C（段階移行）
- **Rationale**: 現在の `cli` 実行基盤を活かしつつ、設計上は `trustbridge` 境界を明確に定義できるため。
- **Trade-offs**: 移行期間の複雑性は上がるが、段階的検証でリスクを制御できる。
- **Follow-up**: Phase 切替条件（契約機能完成、監査連携形式確定）を設計書で明文化する。

### Decision: 同意と監査の責務分離

- **Context**: 要件 2 と要件 4 が同一データを参照するが責務が異なる。
- **Alternatives Considered**:
  1. 単一ストアに全イベントを保存
  2. 同意管理と監査イベントを分離し、追跡IDで関連付け
- **Selected Approach**: 分離 + 追跡ID連携
- **Rationale**: 同意判定の更新頻度と監査保全要件が異なるため、分離が運用上有利。
- **Trade-offs**: クエリ結合が増える。
- **Follow-up**: 監査検索のビュー最適化を設計フェーズで定義。

### Decision: 障害時は安全側判定を既定

- **Context**: 要件 5 で判定完全性が保証できないケースの扱いが必要。
- **Alternatives Considered**:
  1. ベストエフォート許可
  2. 不承認または保留を既定
- **Selected Approach**: 不承認/保留を既定
- **Rationale**: 医療データの最小開示原則と要件整合のため。
- **Trade-offs**: 一時的に業務遅延が増える。
- **Follow-up**: 保留件数の閾値と再評価 SLA を定義。

## Parallelization Considerations

| Workstream | Can Run In Parallel | Depends On | Notes |
| --- | --- | --- | --- |
| 参加者管理モデル設計 | Yes | なし | Consent 設計と並行可能 |
| 同意評価ルール設計 | Yes | なし | FHIR との差分整理が前提 |
| 判定サービス設計 | Partial | 参加者管理 同意評価 | 判定入出力契約は先行定義可能 |
| 監査証跡設計 | Yes | traceId 仕様 | 判定サービスと契約同期が必要 |
| 障害再試行設計 | Yes | provider 健全性指標 | 判定状態機械と最終整合が必要 |
| フロントエンド画面設計 | Partial | API 契約ドラフト | モック契約で先行可能 |

## Risks & Mitigations

- 監査証跡の外部連携形式が未確定
  - **Mitigation**: 設計で `AuditExportAdapter` を抽象化し、形式差し替え可能にする。
- オンチェーン実装範囲の過大化
  - **Mitigation**: 初期は判定根拠ハッシュと最小イベントのみオンチェーンに置く。
- 同意判定ルールの仕様解釈差異
  - **Mitigation**: 判定ルールを `ConsentEvaluationService` の契約として明文化し、テスト観点を先行定義。

## References

- [Midnight Developer Documentation](https://docs.midnight.network/) — プラットフォーム前提と最新導線
- [@midnight-ntwrk/wallet-api (npm)](https://www.npmjs.com/package/@midnight-ntwrk/wallet-api) — Wallet API バージョンと責務
- [@midnight-ntwrk/wallet (npm)](https://www.npmjs.com/package/@midnight-ntwrk/wallet) — Wallet SDK 実装側パッケージ
- [FHIR Consent Resource](https://www.hl7.org/fhir/consent.html) — 同意モデルの標準概念
- [FHIR Consent Definitions (R5)](https://www.hl7.org/fhir/R5/consent-definitions.html) — purpose/provision 属性の定義
- [OpenTelemetry HTTP Metrics SemConv](https://opentelemetry.io/docs/specs/semconv/http/http-metrics/) — 運用メトリクス標準
- [OpenTelemetry Metrics SemConv](https://opentelemetry.io/docs/specs/semconv/general/metrics/) — 汎用メトリクス指針
