import { InventoryFormState, MasterRecord } from '../types';

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
