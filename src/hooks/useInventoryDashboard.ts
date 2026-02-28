import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  fetchInventoryMetadata,
  updateInventoryItem,
} from '../services/inventoryApi';
import { InventoryFormState, MasterRecord, StockItem } from '../types';
import { createInitialForm } from '../utils/inventoryForm';
import { extractShoppingList, filterInventoryItems, summarizeInventory } from '../utils/inventorySelectors';

export const useInventoryDashboard = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<MasterRecord[]>([]);
  const [storageLocations, setStorageLocations] = useState<MasterRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState('在庫情報を読み込んでいます。');
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<InventoryFormState>(createInitialForm());

  useEffect(() => {
    void loadInitialData();
  }, []);

  const filteredItems = useMemo(
    () => filterInventoryItems(items, selectedCategory, search),
    [items, search, selectedCategory],
  );

  const summary = useMemo(() => summarizeInventory(items), [items]);
  const shoppingList = useMemo(() => extractShoppingList(items), [items]);

  const loadInitialData = async () => {
    setIsLoading(true);

    const [metadataResult, itemsResult] = await Promise.allSettled([
      fetchInventoryMetadata(),
      fetchInventoryItems(),
    ]);

    if (metadataResult.status === 'fulfilled') {
      const metadata = metadataResult.value;
      setCategories(metadata.categories);
      setStorageLocations(metadata.storageLocations);
      setForm((current) => ({
        ...createInitialForm(metadata.categories, metadata.storageLocations),
        ...current,
        categoryId: current.categoryId || metadata.categories[0]?.id || '',
        storageLocationId: current.storageLocationId || metadata.storageLocations[0]?.id || '',
      }));
    } else {
      setCategories([]);
      setStorageLocations([]);
    }

    if (itemsResult.status === 'fulfilled') {
      setItems(itemsResult.value);
      setSelectedCategory('すべて');
    } else {
      setItems([]);
    }

    if (metadataResult.status === 'fulfilled' && itemsResult.status === 'fulfilled') {
      setStatusMessage('最新の在庫情報を表示しています。');
    } else if (metadataResult.status === 'fulfilled') {
      setStatusMessage('項目は表示できていますが、在庫一覧を読み込めませんでした。時間をおいて再度お試しください。');
    } else {
      setStatusMessage('サーバーが応答しません。管理者に問い合わせてください。');
    }

    setIsLoading(false);
  };

  const updateQuantity = async (id: string, delta: number) => {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    try {
      const savedItem = await updateInventoryItem(id, {
        quantity: Math.max(0, targetItem.quantity + delta),
      });
      setItems((current) => current.map((item) => (item.id === id ? savedItem : item)));
      setStatusMessage('在庫数を更新しました。');
    } catch {
      setStatusMessage('在庫数を更新できませんでした。時間をおいて再度お試しください。');
    }
  };

  const submitInventoryForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.categoryId || !form.storageLocationId) return;

    try {
      const savedItem = await createInventoryItem({
        ...form,
        name: form.name.trim(),
        unit: form.unit.trim() || '個',
        note: form.note.trim(),
      });

      setItems((current) => [savedItem, ...current]);
      setStatusMessage('在庫を追加しました。');
      setForm(createInitialForm(categories, storageLocations));
    } catch {
      setStatusMessage('在庫を追加できませんでした。時間をおいて再度お試しください。');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setStatusMessage('在庫を削除しました。');
    } catch {
      setStatusMessage('在庫を削除できませんでした。時間をおいて再度お試しください。');
    }
  };

  return {
    categories,
    deleteItem,
    filteredItems,
    form,
    isLoading,
    search,
    selectedCategory,
    setForm,
    setSearch,
    setSelectedCategory,
    shoppingList,
    statusMessage,
    storageLocations,
    submitInventoryForm,
    summary,
    updateQuantity,
  };
};
