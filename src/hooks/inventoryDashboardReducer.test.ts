import { describe, expect, it } from 'vitest';
import { dashboardFixture, metadataFixture, stockItemsFixture } from '../test/fixtures';
import { inventoryDashboardReducer, initialInventoryDashboardState } from './inventoryDashboardReducer';

describe('inventoryDashboardReducer', () => {
  it('ロード開始時に読み込み中へ戻す', () => {
    const nextState = inventoryDashboardReducer(
      { ...initialInventoryDashboardState, isLoading: false },
      { type: 'loadStarted' },
    );

    expect(nextState.isLoading).toBe(true);
  });

  it('初期ロード完了時にダッシュボード情報とフォーム初期値を設定する', () => {
    const nextState = inventoryDashboardReducer(initialInventoryDashboardState, {
      type: 'loadCompleted',
      payload: {
        categories: metadataFixture.categories,
        groupedItems: dashboardFixture.groupedItems,
        items: dashboardFixture.items,
        search: '',
        selectedCategory: 'すべて',
        shoppingList: dashboardFixture.shoppingList,
        statusMessage: '最新の在庫情報を表示しています。',
        storageLocations: metadataFixture.storageLocations,
        summary: dashboardFixture.summary,
      },
    });

    expect(nextState.isLoading).toBe(false);
    expect(nextState.items).toEqual(dashboardFixture.items);
    expect(nextState.groupedItems).toEqual(dashboardFixture.groupedItems);
    expect(nextState.shoppingList).toEqual(dashboardFixture.shoppingList);
    expect(nextState.form.categoryId).toBe('cat-food');
    expect(nextState.form.storageLocationId).toBe('storage-room');
  });

  it('再読込時に検索条件と選択カテゴリを維持する', () => {
    const nextState = inventoryDashboardReducer(
      {
        ...initialInventoryDashboardState,
        categories: metadataFixture.categories,
        storageLocations: metadataFixture.storageLocations,
        search: 'ハンドソープ',
        selectedCategory: 'cat-daily',
        formMode: 'edit',
        editingItemId: 'item-rice',
      },
      {
        type: 'loadCompleted',
        payload: {
          categories: metadataFixture.categories,
          groupedItems: [dashboardFixture.groupedItems[1]],
          items: [dashboardFixture.items[1]],
          search: 'ハンドソープ',
          selectedCategory: 'cat-daily',
          shoppingList: dashboardFixture.shoppingList,
          statusMessage: '最新の在庫情報を表示しています。',
          storageLocations: metadataFixture.storageLocations,
          summary: dashboardFixture.summary,
        },
      },
    );

    expect(nextState.search).toBe('ハンドソープ');
    expect(nextState.selectedCategory).toBe('cat-daily');
    expect(nextState.formMode).toBe('create');
    expect(nextState.editingItemId).toBeNull();
  });

  it('編集開始時に対象在庫の内容をフォームへ反映する', () => {
    const loadedState = inventoryDashboardReducer(initialInventoryDashboardState, {
      type: 'loadCompleted',
      payload: {
        categories: metadataFixture.categories,
        groupedItems: dashboardFixture.groupedItems,
        items: dashboardFixture.items,
        search: '',
        selectedCategory: 'すべて',
        shoppingList: dashboardFixture.shoppingList,
        statusMessage: 'loaded',
        storageLocations: metadataFixture.storageLocations,
        summary: dashboardFixture.summary,
      },
    });

    const nextState = inventoryDashboardReducer(loadedState, {
      type: 'editingStarted',
      item: stockItemsFixture[1],
    });

    expect(nextState.formMode).toBe('edit');
    expect(nextState.editingItemId).toBe('item-soap');
    expect(nextState.form.name).toBe('ハンドソープ');
    expect(nextState.statusMessage).toBe('「ハンドソープ」を編集中です。');
  });

  it('編集キャンセル時にフォームを初期化して通常モードへ戻す', () => {
    const editingState = inventoryDashboardReducer(
      {
        ...initialInventoryDashboardState,
        categories: metadataFixture.categories,
        storageLocations: metadataFixture.storageLocations,
        formMode: 'edit',
        editingItemId: 'item-rice',
        form: {
          ...initialInventoryDashboardState.form,
          name: '編集中の在庫',
          categoryId: 'cat-daily',
        },
      },
      { type: 'editingCancelled' },
    );

    expect(editingState.formMode).toBe('create');
    expect(editingState.editingItemId).toBeNull();
    expect(editingState.form.name).toBe('');
    expect(editingState.form.categoryId).toBe('cat-food');
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

  it('フォーム更新と状態文言更新を反映する', () => {
    const withForm = inventoryDashboardReducer(initialInventoryDashboardState, {
      type: 'formUpdated',
      updater: (current) => ({ ...current, name: '新しい在庫' }),
    });
    const withStatus = inventoryDashboardReducer(withForm, {
      type: 'statusUpdated',
      statusMessage: 'サーバーが応答しません。管理者に問い合わせてください。',
    });

    expect(withForm.form.name).toBe('新しい在庫');
    expect(withStatus.statusMessage).toBe('サーバーが応答しません。管理者に問い合わせてください。');
  });
});
