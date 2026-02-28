import { describe, expect, it } from 'vitest';
import { stockItemsFixture } from '../test/fixtures';
import { extractShoppingList, filterInventoryItems, summarizeInventory } from './inventorySelectors';

describe('inventorySelectors', () => {
  it('カテゴリと検索条件で在庫を絞り込む', () => {
    const items = filterInventoryItems(stockItemsFixture, 'cat-daily', 'ハンド');

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('item-soap');
  });

  it('低在庫と期限順で並び替える', () => {
    const items = filterInventoryItems(
      [
        { ...stockItemsFixture[0], quantity: 5, threshold: 1, expiresAt: '' },
        { ...stockItemsFixture[1], id: 'item-water', quantity: 1, threshold: 2, expiresAt: '' },
      ],
      'すべて',
      '',
    );

    expect(items[0].id).toBe('item-water');
  });

  it('集計と買い物リストを作る', () => {
    const summary = summarizeInventory(stockItemsFixture);
    const shoppingList = extractShoppingList(stockItemsFixture);

    expect(summary.lowStock).toBe(1);
    expect(summary.expiringSoon).toBe(1);
    expect(summary.totalQuantity).toBe(4);
    expect(shoppingList).toHaveLength(1);
    expect(shoppingList[0].id).toBe('item-rice');
  });
});
