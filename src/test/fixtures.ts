import {
  GroupedStockItem,
  InventoryDashboardResponse,
  InventorySummary,
  MetadataResponse,
  ShoppingMemoItem,
  StockItem,
} from '../types';

export const metadataFixture: MetadataResponse = {
  categories: [
    { id: 'cat-food', name: '食品', slug: 'foods' },
    { id: 'cat-daily', name: '日用品', slug: 'daily-goods' },
  ],
  storageLocations: [
    { id: 'storage-room', name: '常温', slug: 'room-temperature' },
    { id: 'storage-bath', name: '洗面所', slug: 'washroom' },
  ],
};

export const stockItemsFixture: StockItem[] = [
  {
    id: 'item-rice',
    name: 'お米',
    categoryId: 'cat-food',
    categoryName: '食品',
    storageLocationId: 'storage-room',
    storageLocationName: '常温',
    quantity: 1,
    effectiveQuantity: 1,
    threshold: 2,
    unit: '袋',
    expiresAt: '',
    daysUntilExpiration: null,
    isExpired: false,
    isExpiringSoon: false,
    updatedAt: '2026-02-28T00:00:00.000Z',
    note: '5kg',
  },
  {
    id: 'item-soap',
    name: 'ハンドソープ',
    categoryId: 'cat-daily',
    categoryName: '日用品',
    storageLocationId: 'storage-bath',
    storageLocationName: '洗面所',
    quantity: 3,
    effectiveQuantity: 3,
    threshold: 1,
    unit: '本',
    expiresAt: '2026-03-03',
    daysUntilExpiration: 3,
    isExpired: false,
    isExpiringSoon: true,
    updatedAt: '2026-02-28T00:00:00.000Z',
    note: '',
  },
];

export const groupedItemsFixture: GroupedStockItem[] = [
  {
    id: 'お米',
    name: 'お米',
    categoryName: '食品',
    storageLocationName: '常温',
    quantity: 1,
    registeredQuantity: 1,
    threshold: 2,
    unit: '袋',
    note: '5kg',
    entryCount: 1,
    expiredCount: 0,
    expiredQuantity: 0,
    nearestExpiresAt: '',
    nearestExpirationDays: null,
    hasExpiredItems: false,
    lowStock: true,
    expiringSoon: false,
    items: [stockItemsFixture[0]],
  },
  {
    id: 'ハンドソープ',
    name: 'ハンドソープ',
    categoryName: '日用品',
    storageLocationName: '洗面所',
    quantity: 3,
    registeredQuantity: 3,
    threshold: 1,
    unit: '本',
    note: '',
    entryCount: 1,
    expiredCount: 0,
    expiredQuantity: 0,
    nearestExpiresAt: '2026-03-03',
    nearestExpirationDays: 3,
    hasExpiredItems: false,
    lowStock: false,
    expiringSoon: true,
    items: [stockItemsFixture[1]],
  },
];

export const shoppingListFixture: ShoppingMemoItem[] = [
  {
    name: 'お米',
    quantity: 1,
    expiredQuantity: 0,
    threshold: 2,
    unit: '袋',
  },
];

export const summaryFixture: InventorySummary = {
  expiringSoon: 1,
  lowStock: 1,
  totalQuantity: 4,
};

export const dashboardFixture: InventoryDashboardResponse = {
  items: stockItemsFixture,
  groupedItems: groupedItemsFixture,
  shoppingList: shoppingListFixture,
  summary: summaryFixture,
};
