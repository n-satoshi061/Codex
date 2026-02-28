import { MetadataResponse, StockItem } from '../types';

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
    threshold: 2,
    unit: '袋',
    expiresAt: '',
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
    threshold: 1,
    unit: '本',
    expiresAt: '2026-03-03',
    updatedAt: '2026-02-28T00:00:00.000Z',
    note: '',
  },
];
