import { GroupedStockItem, MasterRecord } from '../types';
import { InventoryList } from './InventoryList';

type InventoryPageProps = {
  categories: MasterRecord[];
  editingItemId: string | null;
  groupedItems: GroupedStockItem[];
  isLoading: boolean;
  search: string;
  selectedCategory: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
};

export const InventoryPage = ({
  categories,
  editingItemId,
  groupedItems,
  isLoading,
  search,
  selectedCategory,
  onDelete,
  onEdit,
  onSearchChange,
  onSelectedCategoryChange,
  onUpdateQuantity,
}: InventoryPageProps) => (
  <InventoryList
    categories={categories}
    editingItemId={editingItemId}
    groupedItems={groupedItems}
    isLoading={isLoading}
    search={search}
    selectedCategory={selectedCategory}
    onDelete={onDelete}
    onEdit={onEdit}
    onSearchChange={onSearchChange}
    onSelectedCategoryChange={onSelectedCategoryChange}
    onUpdateQuantity={onUpdateQuantity}
  />
);
