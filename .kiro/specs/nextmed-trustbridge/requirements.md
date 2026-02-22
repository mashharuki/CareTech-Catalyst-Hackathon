# Requirements Document

## Introduction

NextMed TrustBridge は、医療データ連携における参加者間の信頼を担保しながら、同意に基づく安全な情報共有、追跡可能な監査、障害時の継続運用を実現するサービスである。

## Requirements

### Requirement 1: 参加者登録と信頼済み主体管理

**Objective:** As a 連携運用管理者, I want 連携参加者を検証済みの主体として登録・管理したい, so that 信頼できる主体間でのみデータ連携を開始できる

#### Acceptance Criteria

1. When 新しい医療機関またはシステムの参加申請が提出された, the NextMed TrustBridge Service shall 申請主体の必要属性を検証し、検証結果を記録する
2. If 申請情報が不足または不整合である, the NextMed TrustBridge Service shall 申請を却下し、不足または不整合の理由を提示する
3. While 主体が有効な参加状態である, the NextMed TrustBridge Service shall その主体を連携要求の許可対象として扱う
4. Where 参加主体の信頼レベル管理機能が含まれる, the NextMed TrustBridge Service shall 主体ごとの信頼レベルを保持し、連携可否判定に利用する
5. The NextMed TrustBridge Service shall 主体の登録、更新、停止、再開の状態遷移履歴を参照可能な形で保持する

### Requirement 2: 患者同意と利用目的制御

**Objective:** As a 患者または代理権限者, I want データ共有の同意範囲を明確に制御したい, so that 意図しない利用目的や過剰共有を防止できる

#### Acceptance Criteria

1. When 同意が作成または更新された, the NextMed TrustBridge Service shall 対象データ種別、共有先、利用目的、有効期間を同意条件として記録する
2. If 連携要求が同意条件を満たさない, the NextMed TrustBridge Service shall 要求を拒否し、不一致となった条件を提示する
3. While 同意が有効期間内かつ撤回されていない, the NextMed TrustBridge Service shall 条件を満たす連携要求を許可判定対象に含める
4. Where 同意の部分撤回機能が含まれる, the NextMed TrustBridge Service shall 撤回対象のデータ種別または利用目的のみを無効化する
5. The NextMed TrustBridge Service shall すべての連携判定において最新の同意状態を参照する

### Requirement 3: データ連携要求と受け渡し判定

**Objective:** As a 連携先システム, I want 必要な医療データ連携要求を標準化された手順で処理したい, so that 必要時に迅速かつ正当なデータ取得ができる

#### Acceptance Criteria

1. When 連携先がデータ連携要求を送信した, the NextMed TrustBridge Service shall 要求に必要な主体情報、患者識別情報、利用目的、要求データ範囲の妥当性を検証する
2. When 連携要求が検証済みで同意条件および信頼済み主体条件を満たす, the NextMed TrustBridge Service shall 連携を承認し、承認結果を要求元と提供元へ通知する
3. If 要求の検証または条件判定に失敗した, the NextMed TrustBridge Service shall 連携を不承認として記録し、失敗理由を返却する
4. While 連携要求が処理中である, the NextMed TrustBridge Service shall 要求状態を追跡可能なステータスとして提供する
5. The NextMed TrustBridge Service shall 各連携要求に対して一意な追跡IDを発行し、同一IDで判定・通知・監査を関連付ける

### Requirement 4: 監査証跡と信頼検証

**Objective:** As a 監査責任者, I want 連携判断と操作履歴を完全に追跡したい, so that 監査・説明責任・紛争解決に対応できる

#### Acceptance Criteria

1. When 参加主体管理、同意管理、連携判定に関する操作が実行された, the NextMed TrustBridge Service shall 操作主体、操作時刻、対象、結果を監査イベントとして記録する
2. If 監査イベントの欠落または改変の疑いが検知された, the NextMed TrustBridge Service shall 検知結果を監査アラートとして記録し、指定管理者へ通知する
3. While 監査期間が指定されている, the NextMed TrustBridge Service shall 指定条件に一致する監査イベントを検索・出力できる
4. Where 外部監査連携機能が含まれる, the NextMed TrustBridge Service shall 外部監査主体が検証可能な形式で監査証跡を提供する
5. The NextMed TrustBridge Service shall 監査証跡と連携判定結果の対応関係を一貫して保持する

### Requirement 5: 障害時継続性と運用可観測性

**Objective:** As a 運用担当者, I want 外部依存障害時でも連携可否を明確に管理したい, so that 安全性を維持しつつ迅速に復旧対応できる

#### Acceptance Criteria

1. When 外部接続先または依存サービスの一時障害が発生した, the NextMed TrustBridge Service shall 影響範囲を識別し、該当要求を再試行可能状態または保留状態として管理する
2. If 障害により判定結果の完全性を保証できない, the NextMed TrustBridge Service shall 連携を安全側で不承認または保留とし、理由を通知する
3. While 障害状態が継続している, the NextMed TrustBridge Service shall 障害関連の連携要求について状態更新と運用者向け可視化情報を提供する
4. Where 運用メトリクス機能が含まれる, the NextMed TrustBridge Service shall 連携成功率、判定遅延、エラー件数を集計可能にする
5. The NextMed TrustBridge Service shall 正常復旧後に保留または再試行対象の要求を再評価可能な状態で保持する
