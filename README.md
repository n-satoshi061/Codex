# うちの在庫ノート

家庭向けの在庫管理アプリです。フロントエンドは React + Vite、バックエンドは Laravel API、DB は MySQL、CI/CD は GitHub Actions を前提にした構成です。在庫の追加、編集、数量更新、削除を 1 画面で行えます。

## 構成

- `/` : React フロントエンド
- `/backend` : Laravel API バックエンド
- `docker-compose.yml` : ローカル MySQL
- `.github/workflows/ci.yml` : GitHub Actions

## フロントエンド

```bash
cp .env.example .env
npm install
npm run dev
```

`VITE_API_BASE_URL` は既定で `http://localhost:8000/api` です。フロントの在庫・カテゴリ・保管場所はすべて Laravel API 経由で MySQL を参照します。

在庫一覧の `編集` ボタンを押すと入力フォームに対象在庫が読み込まれ、カテゴリ、保管場所、数量、下限、期限、メモを更新できます。

## バックエンド

```bash
docker compose up -d --build
```

カテゴリ、保管場所、初期在庫は `seed` で MySQL に投入されます。フロントに固定配列や localStorage フォールバックはありません。

API の確認:

```bash
curl http://localhost:8000/api/inventory-metadata
curl http://localhost:8000/api/inventory-items
```

## GitHub Actions

`ci.yml` では以下を実行します。

- フロントエンドの `npm ci`
- TypeScript の型チェック
- フロントエンドのテスト
- フロントエンドの本番ビルド
- バックエンドの `composer validate`
- PHP ファイルの構文チェック
