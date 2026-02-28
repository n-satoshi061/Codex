import { StockItem } from '../types';
import { daysUntil } from './inventory';

export const filterInventoryItems = (items: StockItem[], selectedCategory: string, search: string) =>
  items
    .filter((item) => selectedCategory === 'すべて' || item.categoryId === selectedCategory)
    .filter((item) => {
      const query = search.trim().toLowerCase();

      return (
        !query ||
        `${item.name} ${item.note} ${item.categoryName} ${item.storageLocationName}`
          .toLowerCase()
          .includes(query)
      );
    })
    .sort((a, b) => {
      const aDays = daysUntil(a.expiresAt);
      const bDays = daysUntil(b.expiresAt);

      if (a.quantity <= a.threshold && b.quantity > b.threshold) return -1;
      if (b.quantity <= b.threshold && a.quantity > a.threshold) return 1;
      if (aDays === null) return 1;
      if (bDays === null) return -1;

      return aDays - bDays;
    });

export const summarizeInventory = (items: StockItem[]) => ({
  lowStock: items.filter((item) => item.quantity <= item.threshold).length,
  expiringSoon: items.filter((item) => {
    const remaining = daysUntil(item.expiresAt);
    return remaining !== null && remaining <= 7;
  }).length,
  totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
});

export const extractShoppingList = (items: StockItem[]) => items.filter((item) => item.quantity <= item.threshold);
