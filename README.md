# うちの在庫ノート

家庭向けの在庫管理アプリです。フロントエンドは React + Vite、バックエンドは Laravel API、DB は MySQL、CI/CD は GitHub Actions を前提にした構成へ切り替えています。

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

## バックエンド

```bash
docker compose up -d mysql
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

カテゴリ、保管場所、初期在庫は `seed` で MySQL に投入されます。フロントに固定配列や localStorage フォールバックはありません。

ローカル環境に `php` と `composer` がないため、このマシンでは Laravel の実行確認はまだしていません。

## GitHub Actions

`ci.yml` では以下を実行します。

- フロントエンドの `npm ci`
- TypeScript の型チェック
- フロントエンドの本番ビルド
- バックエンドの `composer validate`
- PHP ファイルの構文チェック
