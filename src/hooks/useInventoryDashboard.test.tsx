import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { metadataFixture, stockItemsFixture } from '../test/fixtures';
import { useInventoryDashboard } from './useInventoryDashboard';

vi.mock('../services/inventoryApi', () => ({
  createInventoryItem: vi.fn(),
  deleteInventoryItem: vi.fn(),
  fetchInventoryItems: vi.fn(),
  fetchInventoryMetadata: vi.fn(),
  updateInventoryItem: vi.fn(),
}));

import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  fetchInventoryMetadata,
  updateInventoryItem,
} from '../services/inventoryApi';

describe('useInventoryDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchInventoryMetadata).mockResolvedValue(metadataFixture);
    vi.mocked(fetchInventoryItems).mockResolvedValue(stockItemsFixture);
  });

  it('初期ロードで表示用データを組み立てる', async () => {
    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(metadataFixture.categories);
    expect(result.current.filteredItems).toHaveLength(2);
    expect(result.current.shoppingList).toHaveLength(1);
    expect(result.current.form.categoryId).toBe('cat-food');
    expect(result.current.statusMessage).toBe('最新の在庫情報を表示しています。');
  });

  it('数量更新成功時に対象在庫とメッセージを更新する', async () => {
    vi.mocked(updateInventoryItem).mockResolvedValue({
      ...stockItemsFixture[0],
      quantity: 4,
    });

    const { result } = renderHook(() => useInventoryDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateQuantity('item-rice', 3);
    });

    const updatedItem = result.current.filteredItems.find((item) => item.id === 'item-rice');

    expect(updateInventoryItem).toHaveBeenCalledWith('item-rice', { quantity: 4 });
    expect(updatedItem?.quantity).toBe(4);
    expect(result.current.statusMessage).toBe('在庫数を更新しました。');
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
});
