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
    expect(shoppingList[0]).toEqual({
      name: 'お米',
      quantity: 1,
      expiredQuantity: 0,
      threshold: 2,
      unit: '袋',
    });
  });

  it('同じ品名は数量と下限を合算して買い物メモを判定する', () => {
    const shoppingList = extractShoppingList([
      {
        ...stockItemsFixture[0],
        id: 'item-apple-near',
        name: 'りんご',
        quantity: 1,
        threshold: 2,
        unit: '個',
        expiresAt: '2026-02-28',
      },
      {
        ...stockItemsFixture[0],
        id: 'item-apple-late',
        name: 'りんご',
        quantity: 1,
        threshold: 1,
        unit: '個',
        expiresAt: '2026-03-06',
      },
    ]);

    expect(shoppingList).toEqual([
      {
        name: 'りんご',
        quantity: 2,
        expiredQuantity: 0,
        threshold: 3,
        unit: '個',
      },
    ]);
  });

  it('期限切れ在庫は在庫数に含めず買い物メモへ反映する', () => {
    const summary = summarizeInventory([
      {
        ...stockItemsFixture[0],
        id: 'item-apple-expired',
        name: 'りんご',
        quantity: 2,
        threshold: 2,
        unit: '個',
        expiresAt: '2026-02-20',
      },
      {
        ...stockItemsFixture[0],
        id: 'item-apple-fresh',
        name: 'りんご',
        quantity: 1,
        threshold: 1,
        unit: '個',
        expiresAt: '2026-03-06',
      },
    ]);
    const shoppingList = extractShoppingList([
      {
        ...stockItemsFixture[0],
        id: 'item-apple-expired',
        name: 'りんご',
        quantity: 2,
        threshold: 2,
        unit: '個',
        expiresAt: '2026-02-20',
      },
      {
        ...stockItemsFixture[0],
        id: 'item-apple-fresh',
        name: 'りんご',
        quantity: 1,
        threshold: 1,
        unit: '個',
        expiresAt: '2026-03-06',
      },
    ]);

    expect(summary.totalQuantity).toBe(1);
    expect(shoppingList).toEqual([
      {
        name: 'りんご',
        quantity: 1,
        expiredQuantity: 2,
        threshold: 3,
        unit: '個',
      },
    ]);
  });
});
