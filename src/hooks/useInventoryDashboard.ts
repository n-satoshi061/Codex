import { FormEvent, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  fetchInventoryMetadata,
  updateInventoryItem,
} from '../services/inventoryApi';
import { InventoryFormState } from '../types';
import {
  initialInventoryDashboardState,
  inventoryDashboardReducer,
} from './inventoryDashboardReducer';
import { extractShoppingList, filterInventoryItems, summarizeInventory } from '../utils/inventorySelectors';

export const useInventoryDashboard = () => {
  const [state, dispatch] = useReducer(
    inventoryDashboardReducer,
    initialInventoryDashboardState,
  );
  const stateRef = useRef(state);

  stateRef.current = state;

  useEffect(() => {
    const abortController = new AbortController();
    void loadInitialData(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, []);

  const filteredItems = useMemo(
    () => filterInventoryItems(state.items, state.selectedCategory, state.search),
    [state.items, state.search, state.selectedCategory],
  );

  const summary = useMemo(() => summarizeInventory(state.items), [state.items]);
  const shoppingList = useMemo(() => extractShoppingList(state.items), [state.items]);

  const loadInitialData = async (signal: AbortSignal) => {
    dispatch({ type: 'loadStarted' });

    const [metadataResult, itemsResult] = await Promise.allSettled([
      fetchInventoryMetadata(signal),
      fetchInventoryItems(signal),
    ]);

    if (signal.aborted) {
      return;
    }

    const categories = metadataResult.status === 'fulfilled' ? metadataResult.value.categories : [];
    const storageLocations =
      metadataResult.status === 'fulfilled' ? metadataResult.value.storageLocations : [];
    const items = itemsResult.status === 'fulfilled' ? itemsResult.value : [];

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
        items,
        statusMessage,
        storageLocations,
      },
    });
  };

  const updateQuantity = async (id: string, delta: number) => {
    const targetItem = stateRef.current.items.find((item) => item.id === id);
    if (!targetItem) return;

    try {
      const savedItem = await updateInventoryItem(id, {
        quantity: Math.max(0, targetItem.quantity + delta),
      });
      dispatch({ type: 'itemUpdated', item: savedItem, statusMessage: '在庫数を更新しました。' });
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
    if (!currentForm.name.trim() || !currentForm.categoryId || !currentForm.storageLocationId) return;

    try {
      const normalizedPayload = {
        ...currentForm,
        name: currentForm.name.trim(),
        unit: currentForm.unit.trim() || '個',
        note: currentForm.note.trim(),
      };

      if (stateRef.current.formMode === 'edit' && stateRef.current.editingItemId) {
        const savedItem = await updateInventoryItem(stateRef.current.editingItemId, normalizedPayload);
        dispatch({ type: 'itemUpdated', item: savedItem, statusMessage: '在庫情報を更新しました。' });
        return;
      }

      const savedItem = await createInventoryItem(normalizedPayload);
      dispatch({ type: 'itemAdded', item: savedItem, statusMessage: '在庫を追加しました。' });
    } catch {
      dispatch({
        type: 'statusUpdated',
        statusMessage:
          stateRef.current.formMode === 'edit'
            ? '在庫情報を更新できませんでした。時間をおいて再度お試しください。'
            : '在庫を追加できませんでした。時間をおいて再度お試しください。',
      });
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      dispatch({ type: 'itemDeleted', id, statusMessage: '在庫を削除しました。' });
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
  };

  const updateSelectedCategory = (value: string) => {
    dispatch({ type: 'selectedCategoryChanged', value });
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
    filteredItems,
    form: state.form,
    formMode: state.formMode,
    isLoading: state.isLoading,
    search: state.search,
    selectedCategory: state.selectedCategory,
    setForm: updateForm,
    setSearch: updateSearch,
    setSelectedCategory: updateSelectedCategory,
    shoppingList,
    startEditingItem,
    statusMessage: state.statusMessage,
    storageLocations: state.storageLocations,
    submitInventoryForm,
    summary,
    updateQuantity,
  };
};
