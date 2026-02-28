# Laravel API Backend

このディレクトリは家庭向け在庫管理アプリ用の Laravel API バックエンドです。MySQL を前提にしています。

## 前提

- PHP 8.2 以上
- Composer 2
- MySQL 8.x

## セットアップ

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

フロントエンド側はリポジトリ直下で起動します。

```bash
npm install
npm run dev
```

`VITE_API_BASE_URL` は `http://localhost:8000/api` を指す想定です。

カテゴリ、保管場所、初期在庫はすべて seed から MySQL に投入します。フロントエンド側で固定配列は持ちません。
