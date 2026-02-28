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
  threshold: number;
  unit: string;
  expiresAt: string;
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
