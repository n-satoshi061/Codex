export type MasterRecord = {
  id: string;
  name: string;
  slug: string;
};

export type StockItem = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  storageLocationId: string;
  storageLocationName: string;
  quantity: number;
  effectiveQuantity: number;
  threshold: number;
  unit: string;
  expiresAt: string;
  daysUntilExpiration: number | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  updatedAt: string;
  note: string;
};

export type MetadataResponse = {
  categories: MasterRecord[];
  storageLocations: MasterRecord[];
};

export type InventoryFormState = {
  name: string;
  categoryId: string;
  storageLocationId: string;
  quantity: number;
  threshold: number;
  unit: string;
  expiresAt: string;
  note: string;
};

export type InventoryFormMode = 'create' | 'edit';

export type DashboardView = 'inventory' | 'add' | 'shopping';

export type ShoppingMemoItem = {
  name: string;
  quantity: number;
  expiredQuantity: number;
  threshold: number;
  unit: string;
};

export type InventorySummary = {
  lowStock: number;
  expiringSoon: number;
  totalQuantity: number;
};

export type GroupedStockItem = {
  id: string;
  name: string;
  categoryName: string;
  storageLocationName: string;
  quantity: number;
  registeredQuantity: number;
  threshold: number;
  unit: string;
  note: string;
  entryCount: number;
  expiredCount: number;
  expiredQuantity: number;
  nearestExpiresAt: string;
  nearestExpirationDays: number | null;
  hasExpiredItems: boolean;
  lowStock: boolean;
  expiringSoon: boolean;
  items: StockItem[];
};

export type InventoryDashboardResponse = {
  items: StockItem[];
  groupedItems: GroupedStockItem[];
  shoppingList: ShoppingMemoItem[];
  summary: InventorySummary;
};
