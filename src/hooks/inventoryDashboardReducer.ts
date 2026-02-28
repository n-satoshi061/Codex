import { InventoryFormState, MasterRecord, StockItem } from '../types';
import { createInitialForm } from '../utils/inventoryForm';

export type InventoryDashboardState = {
  categories: MasterRecord[];
  form: InventoryFormState;
  isLoading: boolean;
  items: StockItem[];
  search: string;
  selectedCategory: string;
  statusMessage: string;
  storageLocations: MasterRecord[];
};

type InventoryDashboardAction =
  | { type: 'loadStarted' }
  | {
      type: 'loadCompleted';
      payload: {
        categories: MasterRecord[];
        items: StockItem[];
        statusMessage: string;
        storageLocations: MasterRecord[];
      };
    }
  | { type: 'formUpdated'; updater: (current: InventoryFormState) => InventoryFormState }
  | { type: 'searchChanged'; value: string }
  | { type: 'selectedCategoryChanged'; value: string }
  | { type: 'itemAdded'; item: StockItem; statusMessage: string }
  | { type: 'itemUpdated'; item: StockItem; statusMessage: string }
  | { type: 'itemDeleted'; id: string; statusMessage: string }
  | { type: 'statusUpdated'; statusMessage: string };

export const initialInventoryDashboardState: InventoryDashboardState = {
  categories: [],
  form: createInitialForm(),
  isLoading: true,
  items: [],
  search: '',
  selectedCategory: 'すべて',
  statusMessage: '在庫情報を読み込んでいます。',
  storageLocations: [],
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
        form: {
          ...createInitialForm(action.payload.categories, action.payload.storageLocations),
          ...state.form,
          categoryId: state.form.categoryId || action.payload.categories[0]?.id || '',
          storageLocationId: state.form.storageLocationId || action.payload.storageLocations[0]?.id || '',
        },
        isLoading: false,
        items: action.payload.items,
        selectedCategory: 'すべて',
        statusMessage: action.payload.statusMessage,
        storageLocations: action.payload.storageLocations,
      };
    case 'formUpdated':
      return {
        ...state,
        form: action.updater(state.form),
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
    case 'itemAdded':
      return {
        ...state,
        form: createInitialForm(state.categories, state.storageLocations),
        items: [action.item, ...state.items],
        statusMessage: action.statusMessage,
      };
    case 'itemUpdated':
      return {
        ...state,
        items: state.items.map((item) => (item.id === action.item.id ? action.item : item)),
        statusMessage: action.statusMessage,
      };
    case 'itemDeleted':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.id),
        statusMessage: action.statusMessage,
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
