import {
  GroupedStockItem,
  InventoryFormMode,
  InventoryFormState,
  InventorySummary,
  MasterRecord,
  ShoppingMemoItem,
  StockItem,
} from '../types';
import { createFormFromItem, createInitialForm } from '../utils/inventoryForm';

export type InventoryDashboardState = {
  categories: MasterRecord[];
  editingItemId: string | null;
  form: InventoryFormState;
  formMode: InventoryFormMode;
  groupedItems: GroupedStockItem[];
  isLoading: boolean;
  items: StockItem[];
  search: string;
  selectedCategory: string;
  shoppingList: ShoppingMemoItem[];
  statusMessage: string;
  storageLocations: MasterRecord[];
  summary: InventorySummary;
};

type InventoryDashboardAction =
  | { type: 'loadStarted' }
  | {
      type: 'loadCompleted';
      payload: {
        categories: MasterRecord[];
        groupedItems: GroupedStockItem[];
        items: StockItem[];
        search: string;
        shoppingList: ShoppingMemoItem[];
        statusMessage: string;
        storageLocations: MasterRecord[];
        summary: InventorySummary;
        selectedCategory: string;
      };
    }
  | { type: 'formUpdated'; updater: (current: InventoryFormState) => InventoryFormState }
  | { type: 'editingStarted'; item: StockItem }
  | { type: 'editingCancelled' }
  | { type: 'searchChanged'; value: string }
  | { type: 'selectedCategoryChanged'; value: string }
  | { type: 'statusUpdated'; statusMessage: string };

export const initialInventoryDashboardState: InventoryDashboardState = {
  categories: [],
  editingItemId: null,
  form: createInitialForm(),
  formMode: 'create',
  groupedItems: [],
  isLoading: true,
  items: [],
  search: '',
  selectedCategory: 'すべて',
  shoppingList: [],
  statusMessage: '在庫情報を読み込んでいます。',
  storageLocations: [],
  summary: {
    expiringSoon: 0,
    lowStock: 0,
    totalQuantity: 0,
  },
};

export const inventoryDashboardReducer = (
  state: InventoryDashboardState,
  action: InventoryDashboardAction,
): InventoryDashboardState => {
  switch (action.type) {
    case 'loadStarted':
      return {
        ...state,
        isLoading: true,
      };
    case 'loadCompleted':
      return {
        ...state,
        categories: action.payload.categories,
        editingItemId: null,
        form: {
          ...createInitialForm(action.payload.categories, action.payload.storageLocations),
          ...state.form,
          categoryId: state.form.categoryId || action.payload.categories[0]?.id || '',
          storageLocationId: state.form.storageLocationId || action.payload.storageLocations[0]?.id || '',
        },
        formMode: 'create',
        groupedItems: action.payload.groupedItems,
        isLoading: false,
        items: action.payload.items,
        search: action.payload.search,
        selectedCategory: action.payload.selectedCategory,
        shoppingList: action.payload.shoppingList,
        statusMessage: action.payload.statusMessage,
        storageLocations: action.payload.storageLocations,
        summary: action.payload.summary,
      };
    case 'formUpdated':
      return {
        ...state,
        form: action.updater(state.form),
      };
    case 'editingStarted':
      return {
        ...state,
        editingItemId: action.item.id,
        form: createFormFromItem(action.item),
        formMode: 'edit',
        statusMessage: `「${action.item.name}」を編集中です。`,
      };
    case 'editingCancelled':
      return {
        ...state,
        editingItemId: null,
        form: createInitialForm(state.categories, state.storageLocations),
        formMode: 'create',
        statusMessage: '新しい在庫を登録できます。',
      };
    case 'searchChanged':
      return {
        ...state,
        search: action.value,
      };
    case 'selectedCategoryChanged':
      return {
        ...state,
        selectedCategory: action.value,
      };
    case 'statusUpdated':
      return {
        ...state,
        statusMessage: action.statusMessage,
      };
    default:
      return state;
  }
};
