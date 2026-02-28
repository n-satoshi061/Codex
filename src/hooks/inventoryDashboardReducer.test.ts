import { describe, expect, it } from 'vitest';
import { metadataFixture, stockItemsFixture } from '../test/fixtures';
import { inventoryDashboardReducer, initialInventoryDashboardState } from './inventoryDashboardReducer';

describe('inventoryDashboardReducer', () => {
  it('ロード開始時に読み込み中へ戻す', () => {
    const nextState = inventoryDashboardReducer(
      { ...initialInventoryDashboardState, isLoading: false },
      { type: 'loadStarted' },
    );

    expect(nextState.isLoading).toBe(true);
  });

  it('初期ロード完了時にフォームの選択肢を補完する', () => {
    const nextState = inventoryDashboardReducer(initialInventoryDashboardState, {
      type: 'loadCompleted',
      payload: {
        categories: metadataFixture.categories,
        items: stockItemsFixture,
        statusMessage: '最新の在庫情報を表示しています。',
        storageLocations: metadataFixture.storageLocations,
      },
    });

    expect(nextState.isLoading).toBe(false);
    expect(nextState.items).toEqual(stockItemsFixture);
    expect(nextState.form.categoryId).toBe('cat-food');
    expect(nextState.form.storageLocationId).toBe('storage-room');
  });

  it('既に選択済みのカテゴリと保管場所がある場合は維持する', () => {
    const nextState = inventoryDashboardReducer(
      {
        ...initialInventoryDashboardState,
        form: {
          ...initialInventoryDashboardState.form,
          categoryId: 'cat-daily',
          storageLocationId: 'storage-bath',
        },
      },
      {
        type: 'loadCompleted',
        payload: {
          categories: metadataFixture.categories,
          items: stockItemsFixture,
          statusMessage: '最新の在庫情報を表示しています。',
          storageLocations: metadataFixture.storageLocations,
        },
      },
    );

    expect(nextState.form.categoryId).toBe('cat-daily');
    expect(nextState.form.storageLocationId).toBe('storage-bath');
  });

  it('在庫追加時にフォームを初期化して先頭に追加する', () => {
    const loadedState = inventoryDashboardReducer(initialInventoryDashboardState, {
      type: 'loadCompleted',
      payload: {
        categories: metadataFixture.categories,
        items: stockItemsFixture,
        statusMessage: 'loaded',
        storageLocations: metadataFixture.storageLocations,
      },
    });

    const nextState = inventoryDashboardReducer(loadedState, {
      type: 'itemAdded',
      item: stockItemsFixture[1],
      statusMessage: '在庫を追加しました。',
    });

    expect(nextState.items[0]).toEqual(stockItemsFixture[1]);
    expect(nextState.form.name).toBe('');
    expect(nextState.form.categoryId).toBe('cat-food');
    expect(nextState.statusMessage).toBe('在庫を追加しました。');
  });

  it('検索条件と選択カテゴリを更新する', () => {
    const withSearch = inventoryDashboardReducer(initialInventoryDashboardState, {
      type: 'searchChanged',
      value: 'お米',
    });
    const withCategory = inventoryDashboardReducer(withSearch, {
      type: 'selectedCategoryChanged',
      value: 'cat-food',
    });

    expect(withCategory.search).toBe('お米');
    expect(withCategory.selectedCategory).toBe('cat-food');
  });

  it('フォーム更新、在庫更新、削除、状態文言更新を反映する', () => {
    const loadedState = inventoryDashboardReducer(initialInventoryDashboardState, {
      type: 'loadCompleted',
      payload: {
        categories: metadataFixture.categories,
        items: stockItemsFixture,
        statusMessage: 'loaded',
        storageLocations: metadataFixture.storageLocations,
      },
    });

    const withForm = inventoryDashboardReducer(loadedState, {
      type: 'formUpdated',
      updater: (current) => ({ ...current, name: '新しい在庫' }),
    });
    const withUpdatedItem = inventoryDashboardReducer(withForm, {
      type: 'itemUpdated',
      item: { ...stockItemsFixture[0], quantity: 9 },
      statusMessage: '在庫数を更新しました。',
    });
    const withDeletedItem = inventoryDashboardReducer(withUpdatedItem, {
      type: 'itemDeleted',
      id: 'item-soap',
      statusMessage: '在庫を削除しました。',
    });
    const withStatus = inventoryDashboardReducer(withDeletedItem, {
      type: 'statusUpdated',
      statusMessage: 'サーバーが応答しません。管理者に問い合わせてください。',
    });

    expect(withForm.form.name).toBe('新しい在庫');
    expect(withUpdatedItem.items.find((item) => item.id === 'item-rice')?.quantity).toBe(9);
    expect(withDeletedItem.items).toHaveLength(1);
    expect(withStatus.statusMessage).toBe('サーバーが応答しません。管理者に問い合わせてください。');
  });
});
