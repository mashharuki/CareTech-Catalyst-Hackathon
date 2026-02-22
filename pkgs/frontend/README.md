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

- `/` : `/ja` へリダイレクト
- `/{locale}` : ポータル選択画面 (`locale = ja | en`)
- `/{locale}/hospital` : 医療機関向け画面
- `/{locale}/patient` : 患者向け画面
- `/{locale}/appendix` : 審査員向け技術補足
- `/{locale}/ops` : 運用ダッシュボード

## 多言語方針

- 対応言語は日本語 (`ja`) / 英語 (`en`) の2言語。
- ロケールはURLプレフィックス方式で管理する。
- ロケール未指定URLは middleware で既定言語 (`ja`) へリダイレクトする。

## 実装ルール

- 新規画面・レイアウトは `app/` 配下に追加する。
- UI コンポーネントは `components/` を利用する。
- `frontend -> backend` の API 連携境界を維持し、他パッケージへ直接依存しない。

## 移行メモ

- 旧 Vite 構成（`src/`, `vite.config.ts`, `index.html` など）が残っている場合は段階的に撤去する。
- `next build` を通る状態を常時維持し、`app` ルーターの構成競合を発生させない。
