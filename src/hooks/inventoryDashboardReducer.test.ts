import { describe, expect, it } from 'vitest';
import { metadataFixture, stockItemsFixture } from '../test/fixtures';
import { inventoryDashboardReducer, initialInventoryDashboardState } from './inventoryDashboardReducer';

describe('inventoryDashboardReducer', () => {
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
});
