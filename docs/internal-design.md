# うちの在庫ノート 内部設計書

## 1. 文書情報

- 文書名: うちの在庫ノート 内部設計書
- 対象システム: 家庭向け在庫管理アプリ
- 作成日: 2026-02-28

## 2. システム構成

| 層 | 技術 | 役割 |
| --- | --- | --- |
| フロントエンド | React + Vite + TypeScript + styled-components | 画面表示、入力受付、API 呼び出し |
| バックエンド | Laravel | API 提供、バリデーション、DB 永続化 |
| データベース | MySQL | 在庫、カテゴリ、保管場所の保存 |
| CI/CD | GitHub Actions | ビルド、型チェック、PHP 構文チェック |

## 3. フロントエンド内部設計

### 3.1 ディレクトリ構成

| パス | 役割 |
| --- | --- |
| `src/App.tsx` | 画面全体の組み立て |
| `src/components/` | 表示コンポーネント |
| `src/hooks/useInventoryDashboard.ts` | 在庫画面の状態管理と操作処理 |
| `src/hooks/inventoryDashboardReducer.ts` | 状態遷移 |
| `src/services/inventoryApi.ts` | API 通信 |
| `src/utils/` | 純粋関数、selector、補助処理 |
| `src/styles/appStyles.ts` | styled-components 定義 |
| `src/types.ts` | 型定義 |

### 3.2 コンポーネント設計

| コンポーネント | 役割 |
| --- | --- |
| `App` | 画面構成の配線のみを行う |
| `HeroSection` | タイトル、状態メッセージ、サマリー表示 |
| `InventoryForm` | 在庫入力フォーム、編集モード表示、更新・キャンセル操作 |
| `InventoryList` | 在庫一覧、検索、絞り込み、編集開始、数量更新、削除 |
| `ShoppingMemo` | 補充対象一覧 |

### 3.3 状態管理設計

状態管理は `useInventoryDashboard` に集約し、内部で `useReducer` を利用する。

#### 管理状態

| 状態名 | 内容 |
| --- | --- |
| `items` | 在庫一覧 |
| `categories` | カテゴリ一覧 |
| `storageLocations` | 保管場所一覧 |
| `form` | 入力フォーム状態 |
| `formMode` | 新規登録 / 編集モード |
| `editingItemId` | 編集中在庫 ID |
| `search` | 検索文字列 |
| `selectedCategory` | 選択中カテゴリ |
| `statusMessage` | 画面表示用メッセージ |
| `isLoading` | 読み込み中フラグ |

#### reducer アクション

| アクション | 内容 |
| --- | --- |
| `loadStarted` | 初期読み込み開始 |
| `loadCompleted` | 初期読み込み完了 |
| `formUpdated` | フォーム入力更新 |
| `editingStarted` | 在庫編集開始 |
| `editingCancelled` | 在庫編集キャンセル |
| `searchChanged` | 検索条件更新 |
| `selectedCategoryChanged` | カテゴリ絞り込み更新 |
| `itemAdded` | 在庫追加 |
| `itemUpdated` | 在庫更新 |
| `itemDeleted` | 在庫削除 |
| `statusUpdated` | 状態文言更新 |

### 3.4 副作用設計

- 初期表示時に `useEffect` で 1 回だけマスタと在庫一覧を取得する
- `AbortController` を利用して unmount 後更新を防止する
- 派生表示値は reducer 状態に保持せず、selector で算出する

### 3.5 Selector / Utility 設計

| 関数 | 役割 |
| --- | --- |
| `filterInventoryItems` | 一覧絞り込みと並び替え |
| `summarizeInventory` | サマリー集計 |
| `extractShoppingList` | 買い物メモ抽出 |
| `createInitialForm` | フォーム初期値作成 |
| `createFormFromItem` | 編集対象在庫からフォーム状態を生成 |
| `daysUntil` | 期限までの日数計算 |

## 4. API サービス設計

### 4.1 フロントエンド API サービス

| 関数 | 対応 API | 役割 |
| --- | --- | --- |
| `fetchInventoryMetadata` | `GET /api/inventory-metadata` | マスタ取得 |
| `fetchInventoryItems` | `GET /api/inventory-items` | 在庫取得 |
| `createInventoryItem` | `POST /api/inventory-items` | 在庫登録 |
| `updateInventoryItem` | `PATCH /api/inventory-items/{id}` | 在庫更新、編集内容反映 |
| `deleteInventoryItem` | `DELETE /api/inventory-items/{id}` | 在庫削除 |

### 4.2 API 通信方針

- `fetchJson` で通信処理を共通化する
- レスポンスエラー時は例外を投げる
- 削除 API の `204 No Content` を許容する
- 編集時は新規登録 API を使わず更新 API を利用する

## 5. バックエンド内部設計

### 5.1 ルーティング

| メソッド | パス | コントローラ |
| --- | --- | --- |
| GET | `/api/inventory-metadata` | `InventoryMetadataController` |
| GET | `/api/inventory-items` | `InventoryItemController@index` |
| POST | `/api/inventory-items` | `InventoryItemController@store` |
| PATCH | `/api/inventory-items/{inventoryItem}` | `InventoryItemController@update` |
| DELETE | `/api/inventory-items/{inventoryItem}` | `InventoryItemController@destroy` |

### 5.2 コントローラ設計

#### InventoryMetadataController

- カテゴリマスタ取得
- 保管場所マスタ取得
- 表示順でソートした結果を返却

#### InventoryItemController

- 在庫一覧取得
- 在庫登録
- 在庫更新
- 編集対象在庫の読み込み
- 在庫削除
- リクエスト値のバリデーション
- API レスポンス用配列への整形

### 5.3 モデル設計

| モデル | 対応テーブル | 主な役割 |
| --- | --- | --- |
| `Category` | `categories` | カテゴリマスタ |
| `StorageLocation` | `storage_locations` | 保管場所マスタ |
| `InventoryItem` | `inventory_items` | 在庫本体 |

### 5.4 モデル関連

| 元 | 関連 | 先 |
| --- | --- | --- |
| `Category` | 1:N | `InventoryItem` |
| `StorageLocation` | 1:N | `InventoryItem` |
| `InventoryItem` | N:1 | `Category` |
| `InventoryItem` | N:1 | `StorageLocation` |

## 6. データベース内部設計

### 6.1 テーブル一覧

| テーブル名 | 内容 |
| --- | --- |
| `categories` | カテゴリマスタ |
| `storage_locations` | 保管場所マスタ |
| `inventory_items` | 在庫本体 |

### 6.2 主なカラム

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

## 7. バリデーション内部設計

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

## 8. テスト設計

### 8.1 フロントエンド

| 対象 | テスト内容 |
| --- | --- |
| `inventoryDashboardReducer` | 状態遷移、編集モード切り替え |
| `useInventoryDashboard` | 初期ロード、追加、編集、削除、失敗系 |
| `InventoryList` | 表示、編集開始、操作イベント |
| `inventorySelectors` | 絞り込み、集計、並び順 |
| `InventoryItemController` | 在庫編集 API の更新結果 |

### 8.2 実行コマンド

- `npm run lint:types`
- `npm run test:run`
- `npm run test:run -- --coverage`
- `npm run build`

## 9. CI/CD 設計

GitHub Actions で以下を実行する。

- Node.js 環境セットアップ
- フロントエンド依存関係インストール
- TypeScript 型チェック
- フロントエンドビルド
- PHP 環境セットアップ
- Composer 定義確認
- PHP ファイル構文チェック

## 10. 処理フロー

### 10.1 初期表示

1. フロントエンド起動
2. `useInventoryDashboard` 実行
3. マスタ取得 API 呼び出し
4. 在庫一覧 API 呼び出し
5. reducer にロード完了結果を反映
6. 画面へサマリー、一覧、フォーム初期値を表示

### 10.2 在庫追加

1. 利用者がフォーム入力
2. `submitInventoryForm` 実行
3. 登録 API 呼び出し
4. 追加成功時に reducer へ `itemAdded`
5. 一覧更新、フォーム初期化、状態メッセージ更新

### 10.3 数量更新

1. 利用者が `-1` または `+1` を押下
2. `updateQuantity` 実行
3. 更新 API 呼び出し
4. 成功時に reducer へ `itemUpdated`

### 10.4 在庫編集

1. 利用者が編集ボタン押下
2. `startEditingItem` 実行
3. reducer へ `editingStarted`
4. フォームへ対象在庫内容を反映
5. 利用者が更新ボタン押下
6. 更新 API 呼び出し
7. 成功時に reducer へ `itemUpdated`
8. フォームを初期化し新規登録モードへ戻す

### 10.5 在庫削除

1. 利用者が削除ボタン押下
2. `deleteItem` 実行
3. 削除 API 呼び出し
4. 成功時に reducer へ `itemDeleted`
