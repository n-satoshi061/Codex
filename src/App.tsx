import { FormEvent, useEffect, useState } from 'react';
import { HeroSection } from './components/HeroSection';
import { InventoryForm } from './components/InventoryForm';
import { InventoryList } from './components/InventoryList';
import { ShoppingMemo } from './components/ShoppingMemo';
import { AppShell, ContentStack, GlobalStyle, LayoutPanel } from './styles/appStyles';
import { InventoryFormState, MasterRecord, MetadataResponse, StockItem } from './types';
import { daysUntil } from './utils/inventory';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const createInitialForm = (
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

const App = () => {
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

  const loadInitialData = async () => {
    setIsLoading(true);

    const [metadataResult, itemsResult] = await Promise.allSettled([
      fetchJson<{ data: MetadataResponse }>(`${API_BASE_URL}/inventory-metadata`),
      fetchJson<{ data: StockItem[] }>(`${API_BASE_URL}/inventory-items`),
    ]);

    if (metadataResult.status === 'fulfilled') {
      const metadata = metadataResult.value.data;
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
      setItems(itemsResult.value.data);
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

  const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  };

  const createItem = async (payload: InventoryFormState) => {
    const response = await fetchJson<{ data: StockItem }>(`${API_BASE_URL}/inventory-items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.data;
  };

  const patchItem = async (id: string, payload: Partial<InventoryFormState>) => {
    const response = await fetchJson<{ data: StockItem }>(`${API_BASE_URL}/inventory-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return response.data;
  };

  const removeItem = async (id: string) => {
    await fetchJson(`${API_BASE_URL}/inventory-items/${id}`, {
      method: 'DELETE',
    });
  };

  const filteredItems = items
    .filter((item) => selectedCategory === 'すべて' || item.categoryId === selectedCategory)
    .filter((item) => {
      const query = search.trim().toLowerCase();
      return (
        !query ||
        `${item.name} ${item.note} ${item.categoryName} ${item.storageLocationName}`
          .toLowerCase()
          .includes(query)
      );
    })
    .sort((a, b) => {
      const aDays = daysUntil(a.expiresAt);
      const bDays = daysUntil(b.expiresAt);

      if (a.quantity <= a.threshold && b.quantity > b.threshold) return -1;
      if (b.quantity <= b.threshold && a.quantity > a.threshold) return 1;
      if (aDays === null) return 1;
      if (bDays === null) return -1;

      return aDays - bDays;
    });

  const summary = {
    lowStock: items.filter((item) => item.quantity <= item.threshold).length,
    expiringSoon: items.filter((item) => {
      const remaining = daysUntil(item.expiresAt);
      return remaining !== null && remaining <= 7;
    }).length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  };

  const shoppingList = items.filter((item) => item.quantity <= item.threshold);

  const updateQuantity = async (id: string, delta: number) => {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    try {
      const savedItem = await patchItem(id, { quantity: Math.max(0, targetItem.quantity + delta) });
      setItems((current) => current.map((item) => (item.id === id ? savedItem : item)));
      setStatusMessage('MySQL の在庫を更新しました。');
    } catch {
      setStatusMessage('数量更新に失敗しました。Laravel API と MySQL を確認してください。');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.categoryId || !form.storageLocationId) return;

    try {
      const savedItem = await createItem({
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

  const handleDelete = async (id: string) => {
    try {
      await removeItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setStatusMessage('在庫を MySQL から削除しました。');
    } catch {
      setStatusMessage('削除に失敗しました。Laravel API と MySQL を確認してください。');
    }
  };

  return (
    <>
      <GlobalStyle />
      <AppShell>
        <HeroSection statusMessage={statusMessage} summary={summary} />
        <LayoutPanel>
          <InventoryForm
            categories={categories}
            form={form}
            isLoading={isLoading}
            storageLocations={storageLocations}
            onChange={setForm}
            onSubmit={handleSubmit}
          />
          <ContentStack>
            <InventoryList
              categories={categories}
              filteredItems={filteredItems}
              isLoading={isLoading}
              search={search}
              selectedCategory={selectedCategory}
              onDelete={handleDelete}
              onSearchChange={setSearch}
              onSelectedCategoryChange={setSelectedCategory}
              onUpdateQuantity={updateQuantity}
            />
            <ShoppingMemo items={shoppingList} />
          </ContentStack>
        </LayoutPanel>
      </AppShell>
    </>
  );
};

export default App;
