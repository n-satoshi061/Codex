import { GroupedStockItem, ShoppingMemoItem, StockItem } from '../types';
import { daysUntil, isExpired } from './inventory';

const getEffectiveQuantity = (item: StockItem) => (isExpired(item.expiresAt) ? 0 : item.quantity);

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
      const aQuantity = getEffectiveQuantity(a);
      const bQuantity = getEffectiveQuantity(b);

      if (aQuantity <= a.threshold && bQuantity > b.threshold) return -1;
      if (bQuantity <= b.threshold && aQuantity > a.threshold) return 1;
      if (aDays === null) return 1;
      if (bDays === null) return -1;

      return aDays - bDays;
    });

export const summarizeInventory = (items: StockItem[]) => ({
  lowStock: items.filter((item) => getEffectiveQuantity(item) <= item.threshold).length,
  expiringSoon: items.filter((item) => {
    const remaining = daysUntil(item.expiresAt);
    return remaining !== null && remaining >= 0 && remaining <= 7;
  }).length,
  totalQuantity: items.reduce((sum, item) => sum + getEffectiveQuantity(item), 0),
});

export const extractShoppingList = (items: StockItem[]): ShoppingMemoItem[] =>
  Object.values(
    items.reduce<Record<string, ShoppingMemoItem>>((groups, item) => {
      const currentGroup = groups[item.name];

      if (!currentGroup) {
        groups[item.name] = {
          name: item.name,
          quantity: getEffectiveQuantity(item),
          expiredQuantity: isExpired(item.expiresAt) ? item.quantity : 0,
          threshold: item.threshold,
          unit: item.unit,
        };
        return groups;
      }

      groups[item.name] = {
        ...currentGroup,
        quantity: currentGroup.quantity + getEffectiveQuantity(item),
        expiredQuantity: currentGroup.expiredQuantity + (isExpired(item.expiresAt) ? item.quantity : 0),
        threshold: currentGroup.threshold + item.threshold,
      };

      return groups;
    }, {}),
  ).filter((item) => item.quantity <= item.threshold);

export const groupInventoryItems = (items: StockItem[]): GroupedStockItem[] =>
  Object.values(
    items.reduce<Record<string, GroupedStockItem>>((groups, item) => {
      const currentGroup = groups[item.name];
      const remaining = daysUntil(item.expiresAt);
      const expired = isExpired(item.expiresAt);
      const effectiveQuantity = expired ? 0 : item.quantity;
      const expiringSoon = remaining !== null && remaining >= 0 && remaining <= 7;

      if (!currentGroup) {
        groups[item.name] = {
          id: item.name,
          name: item.name,
          categoryName: item.categoryName,
          storageLocationName: item.storageLocationName,
          quantity: effectiveQuantity,
          registeredQuantity: item.quantity,
          threshold: item.threshold,
          unit: item.unit,
          note: item.note,
          entryCount: 1,
          expiredCount: expired ? 1 : 0,
          expiredQuantity: expired ? item.quantity : 0,
          nearestExpiresAt: item.expiresAt,
          hasExpiredItems: expired,
          lowStock: effectiveQuantity <= item.threshold,
          expiringSoon,
          items: [item],
        };

        return groups;
      }

      const currentNearest = daysUntil(currentGroup.nearestExpiresAt);
      const shouldReplaceNearest =
        remaining !== null && (currentNearest === null || remaining < currentNearest);

      groups[item.name] = {
        ...currentGroup,
        categoryName:
          currentGroup.categoryName === item.categoryName ? currentGroup.categoryName : '複数カテゴリ',
        storageLocationName:
          currentGroup.storageLocationName === item.storageLocationName
            ? currentGroup.storageLocationName
            : '複数の保管場所',
        quantity: currentGroup.quantity + effectiveQuantity,
        registeredQuantity: currentGroup.registeredQuantity + item.quantity,
        threshold: currentGroup.threshold + item.threshold,
        note: currentGroup.note || item.note,
        entryCount: currentGroup.entryCount + 1,
        expiredCount: currentGroup.expiredCount + (expired ? 1 : 0),
        expiredQuantity: currentGroup.expiredQuantity + (expired ? item.quantity : 0),
        nearestExpiresAt: shouldReplaceNearest ? item.expiresAt : currentGroup.nearestExpiresAt,
        hasExpiredItems: currentGroup.hasExpiredItems || expired,
        expiringSoon: currentGroup.expiringSoon || expiringSoon,
        items: [...currentGroup.items, item].sort((a, b) => {
          const aDays = daysUntil(a.expiresAt);
          const bDays = daysUntil(b.expiresAt);

          if (aDays === null) return 1;
          if (bDays === null) return -1;

          return aDays - bDays;
        }),
      };

      groups[item.name].lowStock = groups[item.name].quantity <= groups[item.name].threshold;

      return groups;
    }, {}),
  ).sort((a, b) => {
    const aDays = daysUntil(a.nearestExpiresAt);
    const bDays = daysUntil(b.nearestExpiresAt);

    if (a.lowStock && !b.lowStock) return -1;
    if (b.lowStock && !a.lowStock) return 1;
    if (aDays === null) return 1;
    if (bDays === null) return -1;

    return aDays - bDays;
  });
