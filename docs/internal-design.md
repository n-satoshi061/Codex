# うちの在庫ノート 内部設計書

## 1. 文書情報

- 文書名: うちの在庫ノート 内部設計書
- 対象システム: 家庭向け在庫管理アプリ
- 作成日: 2026-02-28
- 最終更新日: 2026-02-28

## 2. システム構成

| 層 | 技術 | 役割 |
| --- | --- | --- |
| フロントエンド | React + Vite + TypeScript + styled-components | 画面表示、入力受付、画面遷移、API 呼び出し |
| バックエンド | Laravel | バリデーション、永続化、表示用集約データ生成 |
| データベース | MySQL | 在庫、カテゴリ、保管場所の保存 |
| CI/CD | GitHub Actions | フロントエンドビルド、型チェック、PHP テスト |

## 3. 責務分離方針

### 3.1 フロントエンド責務

- 画面描画
- 画面切り替え
- 入力フォーム制御
- API 呼び出し
- 利用者向けメッセージ表示

### 3.2 バックエンド責務

- リクエストバリデーション
- DB 永続化
- 在庫一覧の検索、カテゴリ絞り込み
- 期限切れ判定
- 実効在庫数計算
- 品名単位の在庫集約
- 買い物メモ生成
- 一覧表示順制御

## 4. フロントエンド内部設計

### 4.1 ディレクトリ構成

| パス | 役割 |
| --- | --- |
| `src/App.tsx` | 画面切り替えと画面配線 |
| `src/components/` | 画面・表示コンポーネント |
| `src/hooks/useInventoryDashboard.ts` | API 連携と状態管理 |
| `src/hooks/inventoryDashboardReducer.ts` | 画面状態遷移 |
| `src/hooks/useDashboardView.ts` | 画面切り替え状態 |
| `src/services/inventoryApi.ts` | API 通信 |
| `src/utils/inventoryForm.ts` | フォーム初期化、編集値生成 |
| `src/styles/appStyles.ts` | styled-components 定義 |
| `src/types.ts` | 型定義 |

### 4.2 コンポーネント設計

| コンポーネント | 役割 |
| --- | --- |
| `App` | ナビゲーションと画面表示の切り替え |
| `DashboardNavigation` | 在庫一覧、在庫追加、買い物メモの切り替え |
| `InventoryPage` | 在庫一覧画面コンテナ |
| `InventoryList` | 集約在庫一覧表示、検索、絞り込み、明細操作 |
| `InventoryFormPage` | 在庫追加、編集画面コンテナ |
| `InventoryForm` | 在庫登録、編集フォーム |
| `ShoppingMemoPage` | 買い物メモ画面コンテナ |
| `ShoppingMemo` | 不足品表示 |

### 4.3 状態管理設計

状態管理は `useInventoryDashboard` に集約し、内部で `useReducer` を使用する。

#### 管理状態

| 状態名 | 内容 |
| --- | --- |
| `items` | バックエンドから返却された在庫明細 |
| `groupedItems` | バックエンドから返却された品名集約一覧 |
| `shoppingList` | バックエンドから返却された買い物メモ |
| `summary` | バックエンドから返却された集計情報 |
| `categories` | カテゴリ一覧 |
| `storageLocations` | 保管場所一覧 |
| `form` | 入力フォーム状態 |
| `formMode` | 新規登録 / 編集モード |
| `editingItemId` | 編集中在庫 ID |
| `search` | 検索文字列 |
| `selectedCategory` | 選択中カテゴリ |
| `statusMessage` | 利用者向け状態メッセージ |
| `isLoading` | 読み込み中フラグ |

#### reducer アクション

| アクション | 内容 |
| --- | --- |
| `loadStarted` | 読み込み開始 |
| `loadCompleted` | ダッシュボード再取得完了 |
| `formUpdated` | フォーム入力更新 |
| `editingStarted` | 編集開始 |
| `editingCancelled` | 編集キャンセル |
| `searchChanged` | 検索条件更新 |
| `selectedCategoryChanged` | カテゴリ更新 |
| `statusUpdated` | 状態文言更新 |

### 4.4 副作用設計

- 初期表示時に `useEffect` でマスタとダッシュボード情報を取得する
- `AbortController` で重複取得と unmount 後更新を防止する
- 検索変更、カテゴリ変更、追加、更新、削除、数量更新後はダッシュボード API を再取得する
- フロントエンドでは集約計算を持たず、API 応答を表示に使う

## 5. フロントエンド API サービス設計

| 関数 | 対応 API | 役割 |
| --- | --- | --- |
| `fetchInventoryMetadata` | `GET /api/inventory-metadata` | マスタ取得 |
| `fetchInventoryDashboard` | `GET /api/inventory-dashboard` | 表示用在庫、集約一覧、買い物メモ、集計取得 |
| `createInventoryItem` | `POST /api/inventory-items` | 在庫登録 |
| `updateInventoryItem` | `PATCH /api/inventory-items/{id}` | 在庫更新 |
| `deleteInventoryItem` | `DELETE /api/inventory-items/{id}` | 在庫削除 |

### 5.1 API 通信方針

- `fetchJson` で通信処理を共通化する
- エラー時は例外を投げ、フック側で利用者向け文言へ変換する
- 削除 API の `204 No Content` を許容する

## 6. バックエンド内部設計

### 6.1 ルーティング

| メソッド | パス | コントローラ |
| --- | --- | --- |
| GET | `/api/inventory-metadata` | `InventoryMetadataController` |
| GET | `/api/inventory-dashboard` | `InventoryDashboardController` |
| GET | `/api/inventory-items` | `InventoryItemController@index` |
| POST | `/api/inventory-items` | `InventoryItemController@store` |
| PATCH | `/api/inventory-items/{inventoryItem}` | `InventoryItemController@update` |
| DELETE | `/api/inventory-items/{inventoryItem}` | `InventoryItemController@destroy` |

### 6.2 コントローラ設計

#### InventoryMetadataController

- カテゴリ、保管場所マスタを表示順で返却する

#### InventoryDashboardController

- 在庫明細を取得する
- 検索条件、カテゴリ条件を適用する
- 表示用データを `InventoryDashboardBuilder` に委譲する
- 集約在庫一覧、買い物メモ、集計情報を返却する

#### InventoryItemController

- 在庫明細の取得、登録、更新、削除を行う
- 追加、更新後は派生項目を含む明細データを返却する
- リクエスト値を検証して保存用カラムへ変換する

### 6.3 サポートクラス設計

#### InventoryDashboardBuilder

役割:

- 検索条件適用
- カテゴリ絞り込み
- 明細並び順制御
- 期限切れ判定
- 実効在庫数計算
- 品名単位の在庫集約
- 買い物メモ生成
- 集計情報生成
- API 応答整形

主なメソッド:

| メソッド | 役割 |
| --- | --- |
| `applyFilters` | 検索、カテゴリ条件を適用 |
| `sortItems` | 一覧表示順へ並び替え |
| `build` | ダッシュボード応答全体を生成 |
| `presentInventoryItem` | 明細 1 件を API 形式へ整形 |

### 6.4 モデル設計

| モデル | 対応テーブル | 主な役割 |
| --- | --- | --- |
| `Category` | `categories` | カテゴリマスタ |
| `StorageLocation` | `storage_locations` | 保管場所マスタ |
| `InventoryItem` | `inventory_items` | 在庫本体 |

### 6.5 モデル関連

| 元 | 関連 | 先 |
| --- | --- | --- |
| `Category` | 1:N | `InventoryItem` |
| `StorageLocation` | 1:N | `InventoryItem` |
| `InventoryItem` | N:1 | `Category` |
| `InventoryItem` | N:1 | `StorageLocation` |

## 7. データベース内部設計

### 7.1 テーブル一覧

| テーブル名 | 内容 |
| --- | --- |
| `categories` | カテゴリマスタ |
| `storage_locations` | 保管場所マスタ |
| `inventory_items` | 在庫本体 |

### 7.2 主なカラム

#### categories

- `id`
- `name`
- `slug`
- `sort_order`
- `created_at`
- `updated_at`

#### storage_locations

- `id`
- `name`
- `slug`
- `sort_order`
- `created_at`
- `updated_at`

#### inventory_items

- `id`
- `category_id`
- `storage_location_id`
- `name`
- `quantity`
- `threshold`
- `unit`
- `expires_at`
- `note`
- `created_at`
- `updated_at`

## 8. バリデーション内部設計

| 項目 | ルール |
| --- | --- |
| `name` | required / string / max:255 |
| `categoryId` | required / uuid / exists |
| `storageLocationId` | required / uuid / exists |
| `quantity` | required / integer / min:0 |
| `threshold` | required / integer / min:0 |
| `unit` | required / string / max:30 |
| `expiresAt` | nullable / date |
| `note` | nullable / string / max:1000 |

## 9. テスト設計

### 9.1 フロントエンド

| 対象 | テスト内容 |
| --- | --- |
| `App` | 画面切り替え |
| `InventoryList` | 集約表示、明細展開、操作イベント |
| `inventoryDashboardReducer` | 状態遷移、検索条件保持 |
| `useInventoryDashboard` | 初期ロード、再取得、追加、編集、削除、失敗系 |

### 9.2 バックエンド

| 対象 | テスト内容 |
| --- | --- |
| `InventoryDashboardController` | 集約一覧、買い物メモ、期限切れ除外、集計 |
| `InventoryItemController` | 在庫更新 API |

### 9.3 実行コマンド

- `npm run lint:types`
- `npm run test:run`
- `npm run build`
- `docker compose exec backend php artisan test`

## 10. CI/CD 設計

GitHub Actions で以下を実行する。

- Node.js 環境セットアップ
- フロントエンド依存関係インストール
- TypeScript 型チェック
- フロントエンドビルド
- PHP 環境セットアップ
- Composer 定義確認
- PHP ファイル構文チェック

## 11. 処理フロー

### 11.1 初期表示

1. フロントエンド起動
2. `useInventoryDashboard` 実行
3. マスタ取得 API 呼び出し
4. ダッシュボード取得 API 呼び出し
5. reducer へロード完了結果を反映
6. 画面へ在庫一覧または他画面を表示

### 11.2 在庫一覧取得

1. フロントエンドが検索条件、カテゴリ条件を指定して API 呼び出し
2. バックエンドが在庫を取得
3. バックエンドが検索、絞り込み、期限判定、集約、買い物メモ生成を実行
4. バックエンドが表示用 JSON を返却
5. フロントエンドが応答をそのまま状態へ反映

### 11.3 在庫追加

1. 利用者がフォーム入力
2. `submitInventoryForm` 実行
3. 登録 API 呼び出し
4. 登録成功後にダッシュボード API を再取得
5. reducer に再取得結果を反映

### 11.4 数量更新

1. 利用者が `-1` または `+1` を押下
2. 更新 API 呼び出し
3. 成功後にダッシュボード API を再取得
4. 一覧表示を更新

### 11.5 在庫編集

1. 利用者が一覧の編集ボタン押下
2. 編集対象を reducer へ設定
3. 在庫追加画面を編集モードで表示
4. 更新 API 呼び出し
5. 成功後にダッシュボード API を再取得
6. 一覧画面へ戻す

### 11.6 在庫削除

1. 利用者が削除ボタン押下
2. 削除 API 呼び出し
3. 成功後にダッシュボード API を再取得
4. 一覧表示を更新
