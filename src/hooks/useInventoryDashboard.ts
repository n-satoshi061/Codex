import { FormEvent, useEffect, useReducer, useRef } from 'react';
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryDashboard,
  fetchInventoryMetadata,
  updateInventoryItem,
} from '../services/inventoryApi';
import { InventoryFormState } from '../types';
import {
  initialInventoryDashboardState,
  inventoryDashboardReducer,
} from './inventoryDashboardReducer';

export const useInventoryDashboard = () => {
  const [state, dispatch] = useReducer(
    inventoryDashboardReducer,
    initialInventoryDashboardState,
  );
  const stateRef = useRef(state);
  const abortControllerRef = useRef<AbortController | null>(null);

  stateRef.current = state;

  useEffect(() => {
    void loadInitialData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const loadDashboard = async (
    search: string,
    selectedCategory: string,
    statusMessage?: string,
  ) => {
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const dashboard = await fetchInventoryDashboard(search, selectedCategory, abortController.signal);

      if (abortController.signal.aborted) {
        return;
      }

      dispatch({
        type: 'loadCompleted',
        payload: {
          categories: stateRef.current.categories,
          groupedItems: dashboard.groupedItems,
          items: dashboard.items,
          search,
          shoppingList: dashboard.shoppingList,
          selectedCategory,
          statusMessage: statusMessage ?? '最新の在庫情報を表示しています。',
          storageLocations: stateRef.current.storageLocations,
          summary: dashboard.summary,
        },
      });
    } catch {
      if (abortController.signal.aborted) {
        return;
      }

      dispatch({
        type: 'statusUpdated',
        statusMessage: '在庫一覧を読み込めませんでした。時間をおいて再度お試しください。',
      });
    }
  };

  const loadInitialData = async () => {
    dispatch({ type: 'loadStarted' });
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const [metadataResult, itemsResult] = await Promise.allSettled([
      fetchInventoryMetadata(abortController.signal),
      fetchInventoryDashboard('', 'すべて', abortController.signal),
    ]);

    if (abortController.signal.aborted) {
      return;
    }

    const categories = metadataResult.status === 'fulfilled' ? metadataResult.value.categories : [];
    const storageLocations =
      metadataResult.status === 'fulfilled' ? metadataResult.value.storageLocations : [];
    const dashboard = itemsResult.status === 'fulfilled'
      ? itemsResult.value
      : {
          groupedItems: [],
          items: [],
          shoppingList: [],
          summary: {
            expiringSoon: 0,
            lowStock: 0,
            totalQuantity: 0,
          },
        };

    const statusMessage =
      metadataResult.status === 'fulfilled' && itemsResult.status === 'fulfilled'
        ? '最新の在庫情報を表示しています。'
        : metadataResult.status === 'fulfilled'
          ? '項目は表示できていますが、在庫一覧を読み込めませんでした。時間をおいて再度お試しください。'
          : 'サーバーが応答しません。管理者に問い合わせてください。';

    dispatch({
      type: 'loadCompleted',
      payload: {
        categories,
        groupedItems: dashboard.groupedItems,
        items: dashboard.items,
        search: '',
        shoppingList: dashboard.shoppingList,
        selectedCategory: 'すべて',
        statusMessage,
        storageLocations,
        summary: dashboard.summary,
      },
    });
  };

  const updateQuantity = async (id: string, delta: number) => {
    const targetItem = stateRef.current.items.find((item) => item.id === id);
    if (!targetItem) return;

    try {
      await updateInventoryItem(id, {
        quantity: Math.max(0, targetItem.quantity + delta),
      });
      await loadDashboard(stateRef.current.search, stateRef.current.selectedCategory, '在庫数を更新しました。');
    } catch {
      dispatch({
        type: 'statusUpdated',
        statusMessage: '在庫数を更新できませんでした。時間をおいて再度お試しください。',
      });
    }
  };

  const submitInventoryForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentForm = stateRef.current.form;
    if (!currentForm.name.trim() || !currentForm.categoryId || !currentForm.storageLocationId) {
      return false;
    }

    try {
      const normalizedPayload = {
        ...currentForm,
        name: currentForm.name.trim(),
        unit: currentForm.unit.trim() || '個',
        note: currentForm.note.trim(),
      };

      if (stateRef.current.formMode === 'edit' && stateRef.current.editingItemId) {
        await updateInventoryItem(stateRef.current.editingItemId, normalizedPayload);
        await loadDashboard(stateRef.current.search, stateRef.current.selectedCategory, '在庫情報を更新しました。');
        return true;
      }

      await createInventoryItem(normalizedPayload);
      await loadDashboard(stateRef.current.search, stateRef.current.selectedCategory, '在庫を追加しました。');
      return true;
    } catch {
      dispatch({
        type: 'statusUpdated',
        statusMessage:
          stateRef.current.formMode === 'edit'
            ? '在庫情報を更新できませんでした。時間をおいて再度お試しください。'
            : '在庫を追加できませんでした。時間をおいて再度お試しください。',
      });
      return false;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      await loadDashboard(stateRef.current.search, stateRef.current.selectedCategory, '在庫を削除しました。');
    } catch {
      dispatch({
        type: 'statusUpdated',
        statusMessage: '在庫を削除できませんでした。時間をおいて再度お試しください。',
      });
    }
  };

  const updateForm = (updater: (current: InventoryFormState) => InventoryFormState) => {
    dispatch({ type: 'formUpdated', updater });
  };

  const updateSearch = (value: string) => {
    dispatch({ type: 'searchChanged', value });
    void loadDashboard(value, stateRef.current.selectedCategory);
  };

  const updateSelectedCategory = (value: string) => {
    dispatch({ type: 'selectedCategoryChanged', value });
    void loadDashboard(stateRef.current.search, value);
  };

  const startEditingItem = (id: string) => {
    const targetItem = stateRef.current.items.find((item) => item.id === id);
    if (!targetItem) return;

    dispatch({ type: 'editingStarted', item: targetItem });
  };

  const cancelEditingItem = () => {
    dispatch({ type: 'editingCancelled' });
  };

  return {
    categories: state.categories,
    cancelEditingItem,
    deleteItem,
    editingItemId: state.editingItemId,
    form: state.form,
    formMode: state.formMode,
    groupedItems: state.groupedItems,
    isLoading: state.isLoading,
    items: state.items,
    search: state.search,
    selectedCategory: state.selectedCategory,
    setForm: updateForm,
    setSearch: updateSearch,
    setSelectedCategory: updateSelectedCategory,
    shoppingList: state.shoppingList,
    startEditingItem,
    statusMessage: state.statusMessage,
    storageLocations: state.storageLocations,
    submitInventoryForm,
    summary: state.summary,
    updateQuantity,
  };
};
