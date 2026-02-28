import { InventoryFormState, MasterRecord, StockItem } from '../types';

export const createInitialForm = (
  categories: MasterRecord[] = [],
  storageLocations: MasterRecord[] = [],
): InventoryFormState => ({
  name: '',
  categoryId: categories[0]?.id ?? '',
  storageLocationId: storageLocations[0]?.id ?? '',
  quantity: 1,
  threshold: 1,
  unit: '個',
  expiresAt: '',
  note: '',
});

export const createFormFromItem = (item: StockItem): InventoryFormState => ({
  name: item.name,
  categoryId: item.categoryId,
  storageLocationId: item.storageLocationId,
  quantity: item.quantity,
  threshold: item.threshold,
  unit: item.unit,
  expiresAt: item.expiresAt ?? '',
  note: item.note,
});
