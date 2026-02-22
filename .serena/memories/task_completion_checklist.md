# Task Completion Checklist
- 依頼に対して、対象範囲の package を特定してから変更する（`contract`/`cli`/`frontend`）。
- 仕様駆動タスクの場合は `.kiro/specs` と `.kiro/steering` の状態を確認し、必要なら不足を明示する。
- スキルやガイド更新時は `.agents/skills` と `.codex/skills` のミラー差分を確認する。
- 実装後に少なくとも関連コマンドを実行する（例: `lint`/`test`/`build`/`format`）。
- `git diff -- <path>` と `git status --short` で変更を確認する。
- 最終報告は日本語で、変更内容・理由・未実施事項（あれば）を明記する。