import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dashboardFixture, metadataFixture, stockItemsFixture } from '../test/fixtures';
import { useInventoryDashboard } from './useInventoryDashboard';

vi.mock('../services/inventoryApi', () => ({
  createInventoryItem: vi.fn(),
  deleteInventoryItem: vi.fn(),
  fetchInventoryDashboard: vi.fn(),
  fetchInventoryMetadata: vi.fn(),
  updateInventoryItem: vi.fn(),
}));

import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryDashboard,
  fetchInventoryMetadata,
  updateInventoryItem,
} from '../services/inventoryApi';

describe('useInventoryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchInventoryMetadata).mockResolvedValue(metadataFixture);
    vi.mocked(fetchInventoryDashboard).mockResolvedValue(dashboardFixture);
  });

  it('初期ロードで表示用データを組み立てる', async () => {
    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(metadataFixture.categories);
    expect(result.current.items).toHaveLength(2);
    expect(result.current.groupedItems).toHaveLength(2);
    expect(result.current.shoppingList).toHaveLength(1);
    expect(result.current.form.categoryId).toBe('cat-food');
    expect(result.current.statusMessage).toBe('最新の在庫情報を表示しています。');
  });

  it('項目だけ取得できた場合は案内文言を切り替える', async () => {
    vi.mocked(fetchInventoryDashboard).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(metadataFixture.categories);
    expect(result.current.items).toEqual([]);
    expect(result.current.statusMessage).toBe(
      '項目は表示できていますが、在庫一覧を読み込めませんでした。時間をおいて再度お試しください。',
    );
  });

  it('初期ロードが失敗した場合は接続エラー文言を返す', async () => {
    vi.mocked(fetchInventoryMetadata).mockRejectedValue(new Error('failed'));
    vi.mocked(fetchInventoryDashboard).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual([]);
    expect(result.current.storageLocations).toEqual([]);
    expect(result.current.statusMessage).toBe('サーバーが応答しません。管理者に問い合わせてください。');
  });

  it('数量更新成功時に対象在庫とメッセージを更新する', async () => {
    vi.mocked(updateInventoryItem).mockResolvedValue({
      ...stockItemsFixture[0],
      quantity: 4,
    });
    vi.mocked(fetchInventoryDashboard)
      .mockResolvedValueOnce(dashboardFixture)
      .mockResolvedValueOnce({
        ...dashboardFixture,
        items: [{ ...dashboardFixture.items[0], quantity: 4, effectiveQuantity: 4 }, dashboardFixture.items[1]],
      });

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateQuantity('item-rice', 3);
    });

    const updatedItem = result.current.items.find((item) => item.id === 'item-rice');

    expect(updateInventoryItem).toHaveBeenCalledWith('item-rice', { quantity: 4 });
    expect(fetchInventoryDashboard).toHaveBeenLastCalledWith('', 'すべて', expect.any(AbortSignal));
    expect(updatedItem?.quantity).toBe(4);
    expect(result.current.statusMessage).toBe('在庫数を更新しました。');
  });

  it('数量更新失敗時にエラーメッセージを表示する', async () => {
    vi.mocked(updateInventoryItem).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateQuantity('item-rice', 1);
    });

    expect(result.current.statusMessage).toBe('在庫数を更新できませんでした。時間をおいて再度お試しください。');
  });

  it('削除成功時に在庫一覧から取り除く', async () => {
    vi.mocked(deleteInventoryItem).mockResolvedValue(undefined);
    vi.mocked(fetchInventoryDashboard)
      .mockResolvedValueOnce(dashboardFixture)
      .mockResolvedValueOnce({
        ...dashboardFixture,
        items: [dashboardFixture.items[1]],
        groupedItems: [dashboardFixture.groupedItems[1]],
      });

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteItem('item-rice');
    });

    expect(result.current.items.find((item) => item.id === 'item-rice')).toBeUndefined();
    expect(result.current.statusMessage).toBe('在庫を削除しました。');
  });

  it('削除失敗時にエラーメッセージを表示する', async () => {
    vi.mocked(deleteInventoryItem).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteItem('item-rice');
    });

    expect(result.current.statusMessage).toBe('在庫を削除できませんでした。時間をおいて再度お試しください。');
  });

  it('追加失敗時にエラーメッセージを表示する', async () => {
    vi.mocked(createInventoryItem).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setForm((current) => ({
        ...current,
        name: '新しい在庫',
      }));
    });

    await act(async () => {
      await result.current.submitInventoryForm({
        preventDefault: vi.fn(),
      } as never);
    });

    expect(result.current.statusMessage).toBe('在庫を追加できませんでした。時間をおいて再度お試しください。');
    expect(deleteInventoryItem).not.toHaveBeenCalled();
  });

  it('編集開始時にフォームへ対象在庫を読み込む', async () => {
    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startEditingItem('item-soap');
    });

    expect(result.current.formMode).toBe('edit');
    expect(result.current.editingItemId).toBe('item-soap');
    expect(result.current.form.name).toBe('ハンドソープ');
    expect(result.current.form.storageLocationId).toBe('storage-bath');
  });

  it('編集更新成功時に対象在庫を置き換えて通常モードへ戻す', async () => {
    vi.mocked(updateInventoryItem).mockResolvedValue({
      ...stockItemsFixture[0],
      name: '無洗米',
      categoryId: 'cat-daily',
      categoryName: '日用品',
      storageLocationId: 'storage-bath',
      storageLocationName: '洗面所',
      quantity: 5,
      threshold: 3,
      expiresAt: '2026-04-15',
      note: '入れ替え済み',
    });
    vi.mocked(fetchInventoryDashboard)
      .mockResolvedValueOnce(dashboardFixture)
      .mockResolvedValueOnce({
        ...dashboardFixture,
        items: [
          {
            ...dashboardFixture.items[0],
            name: '無洗米',
            categoryId: 'cat-daily',
            categoryName: '日用品',
            storageLocationId: 'storage-bath',
            storageLocationName: '洗面所',
            quantity: 5,
            effectiveQuantity: 5,
            threshold: 3,
            expiresAt: '2026-04-15',
            daysUntilExpiration: 46,
            note: '入れ替え済み',
          },
          dashboardFixture.items[1],
        ],
      });

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startEditingItem('item-rice');
      result.current.setForm((current) => ({
        ...current,
        name: '無洗米',
        categoryId: 'cat-daily',
        storageLocationId: 'storage-bath',
        quantity: 5,
        threshold: 3,
        expiresAt: '2026-04-15',
        note: '入れ替え済み',
      }));
    });

    await act(async () => {
      await result.current.submitInventoryForm({
        preventDefault: vi.fn(),
      } as never);
    });

    expect(updateInventoryItem).toHaveBeenCalledWith('item-rice', {
      name: '無洗米',
      categoryId: 'cat-daily',
      storageLocationId: 'storage-bath',
      quantity: 5,
      threshold: 3,
      unit: '袋',
      expiresAt: '2026-04-15',
      note: '入れ替え済み',
    });
    expect(result.current.formMode).toBe('create');
    expect(result.current.editingItemId).toBeNull();
    expect(result.current.items.find((item) => item.id === 'item-rice')?.name).toBe('無洗米');
    expect(result.current.statusMessage).toBe('在庫情報を更新しました。');
  });

  it('編集更新失敗時にエラーメッセージを表示して編集状態を維持する', async () => {
    vi.mocked(updateInventoryItem).mockRejectedValue(new Error('failed'));

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startEditingItem('item-rice');
    });

    await act(async () => {
      await result.current.submitInventoryForm({
        preventDefault: vi.fn(),
      } as never);
    });

    expect(result.current.formMode).toBe('edit');
    expect(result.current.statusMessage).toBe('在庫情報を更新できませんでした。時間をおいて再度お試しください。');
  });

  it('編集キャンセル時に通常モードへ戻る', async () => {
    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.startEditingItem('item-rice');
      result.current.cancelEditingItem();
    });

    expect(result.current.formMode).toBe('create');
    expect(result.current.editingItemId).toBeNull();
    expect(result.current.form.name).toBe('');
  });

  it('検索とカテゴリ絞り込みを反映する', async () => {
    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.setSearch('ハンドソープ');
    });

    expect(fetchInventoryDashboard).toHaveBeenLastCalledWith('ハンドソープ', 'すべて', expect.any(AbortSignal));

    await act(async () => {
      result.current.setSelectedCategory('cat-daily');
    });

    expect(fetchInventoryDashboard).toHaveBeenLastCalledWith('ハンドソープ', 'cat-daily', expect.any(AbortSignal));
  });
});
