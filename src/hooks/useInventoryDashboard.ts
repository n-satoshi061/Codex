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
  const [statusMessage, setStatusMessage] = useState('Laravel API から在庫とマスタを読み込み中です。');
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
      setStatusMessage('Laravel API と MySQL から在庫を同期中です。');
    } else if (metadataResult.status === 'fulfilled') {
      setStatusMessage('マスタは取得できましたが、在庫一覧の取得に失敗しました。MySQL の在庫データを確認してください。');
    } else {
      setStatusMessage('Laravel API に接続できません。MySQL 側の起動とシード投入を確認してください。');
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
      setStatusMessage('MySQL の在庫を更新しました。');
    } catch {
      setStatusMessage('数量更新に失敗しました。Laravel API と MySQL を確認してください。');
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
      setStatusMessage('在庫を MySQL に追加しました。');
      setForm(createInitialForm(categories, storageLocations));
    } catch {
      setStatusMessage('在庫追加に失敗しました。Laravel API と MySQL を確認してください。');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteInventoryItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setStatusMessage('在庫を MySQL から削除しました。');
    } catch {
      setStatusMessage('削除に失敗しました。Laravel API と MySQL を確認してください。');
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
