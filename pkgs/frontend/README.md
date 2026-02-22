# Frontend (Next.js App Router)

このパッケージは `Next.js` を採用したフロントエンド実装です。  
v0 由来のモックアップをベースに、`app/` 配下で画面実装を進めます。

## 実行コマンド

```bash
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend start
```

## ルーティング方針

- `/` : ポータル選択画面
- `/hospital` : 医療機関向け画面
- `/patient` : 患者向け画面
- `/appendix` : 審査員向け技術補足

## 実装ルール

- 新規画面・レイアウトは `app/` 配下に追加する。
- UI コンポーネントは `components/` を利用する。
- `frontend -> backend` の API 連携境界を維持し、他パッケージへ直接依存しない。

## 移行メモ

- 旧 Vite 構成（`src/`, `vite.config.ts`, `index.html` など）が残っている場合は段階的に撤去する。
- `next build` を通る状態を常時維持し、`app` ルーターの構成競合を発生させない。
