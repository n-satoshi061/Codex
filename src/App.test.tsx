import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { metadataFixture, stockItemsFixture } from './test/fixtures';
import { groupInventoryItems, extractShoppingList, summarizeInventory } from './utils/inventorySelectors';

vi.mock('./hooks/useInventoryDashboard', () => ({
  useInventoryDashboard: vi.fn(),
}));

import { useInventoryDashboard } from './hooks/useInventoryDashboard';

const createHookValue = () => ({
  cancelEditingItem: vi.fn(),
  categories: metadataFixture.categories,
  deleteItem: vi.fn(),
  editingItemId: null,
  filteredItems: stockItemsFixture,
  groupedItems: groupInventoryItems(stockItemsFixture),
  form: {
    name: '',
    categoryId: metadataFixture.categories[0].id,
    storageLocationId: metadataFixture.storageLocations[0].id,
    quantity: 1,
    threshold: 1,
    unit: '個',
    expiresAt: '',
    note: '',
  },
  formMode: 'create' as const,
  isLoading: false,
  search: '',
  selectedCategory: 'すべて',
  setForm: vi.fn(),
  setSearch: vi.fn(),
  setSelectedCategory: vi.fn(),
  shoppingList: extractShoppingList(stockItemsFixture),
  startEditingItem: vi.fn(),
  statusMessage: '最新の在庫情報を表示しています。',
  storageLocations: metadataFixture.storageLocations,
  submitInventoryForm: vi.fn().mockResolvedValue(true),
  summary: summarizeInventory(stockItemsFixture),
  updateQuantity: vi.fn(),
});

describe('App', () => {
  it('ナビゲーションで画面を切り替えられる', async () => {
    const user = userEvent.setup();
    vi.mocked(useInventoryDashboard).mockReturnValue(createHookValue());

    render(<App />);

    expect(screen.getAllByRole('heading', { name: '在庫一覧' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { name: '買い物メモ' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '在庫追加' }));
    expect(screen.getByRole('heading', { name: '在庫を追加' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '買い物メモ' }));
    expect(screen.getAllByRole('heading', { name: '買い物メモ' }).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '在庫一覧' }));
    expect(screen.getByPlaceholderText('品名・メモ・カテゴリ・保管場所で検索')).toBeInTheDocument();
  });
});
