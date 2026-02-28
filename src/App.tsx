import { FormEvent, useEffect, useState } from 'react';

type MasterRecord = {
  id: string;
  name: string;
  slug: string;
};

type StockItem = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  storageLocationId: string;
  storageLocationName: string;
  quantity: number;
  threshold: number;
  unit: string;
  expiresAt: string;
  updatedAt: string;
  note: string;
};

type MetadataResponse = {
  categories: MasterRecord[];
  storageLocations: MasterRecord[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

function daysUntil(dateString: string) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function App() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<MasterRecord[]>([]);
  const [storageLocations, setStorageLocations] = useState<MasterRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState('Laravel API から在庫とマスタを読み込み中です。');
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    storageLocationId: '',
    quantity: 1,
    threshold: 1,
    unit: '個',
    expiresAt: '',
    note: '',
  });

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function loadInitialData() {
    setIsLoading(true);

    try {
      const [itemsResponse, metadataResponse] = await Promise.all([
        fetchJson<{ data: StockItem[] }>(`${API_BASE_URL}/inventory-items`),
        fetchJson<{ data: MetadataResponse }>(`${API_BASE_URL}/inventory-metadata`),
      ]);

      setItems(itemsResponse.data);
      setCategories(metadataResponse.data.categories);
      setStorageLocations(metadataResponse.data.storageLocations);
      setSelectedCategory('すべて');
      setForm((current) => ({
        ...current,
        categoryId: metadataResponse.data.categories[0]?.id ?? '',
        storageLocationId: metadataResponse.data.storageLocations[0]?.id ?? '',
      }));
      setStatusMessage('Laravel API と MySQL から在庫を同期中です。');
    } catch {
      setItems([]);
      setCategories([]);
      setStorageLocations([]);
      setStatusMessage('Laravel API に接続できません。MySQL 側の起動とシード投入を確認してください。');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
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
  }

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

  async function createItem(payload: typeof form) {
    const response = await fetchJson<{ data: StockItem }>(`${API_BASE_URL}/inventory-items`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return response.data;
  }

  async function patchItem(id: string, payload: Partial<typeof form>) {
    const response = await fetchJson<{ data: StockItem }>(`${API_BASE_URL}/inventory-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return response.data;
  }

  async function removeItem(id: string) {
    await fetchJson(`${API_BASE_URL}/inventory-items/${id}`, {
      method: 'DELETE',
    });
  }

  async function updateQuantity(id: string, delta: number) {
    const targetItem = items.find((item) => item.id === id);
    if (!targetItem) return;

    try {
      const savedItem = await patchItem(id, { quantity: Math.max(0, targetItem.quantity + delta) });
      setItems((current) => current.map((item) => (item.id === id ? savedItem : item)));
      setStatusMessage('MySQL の在庫を更新しました。');
    } catch {
      setStatusMessage('数量更新に失敗しました。Laravel API と MySQL を確認してください。');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      setForm({
        name: '',
        categoryId: categories[0]?.id ?? '',
        storageLocationId: storageLocations[0]?.id ?? '',
        quantity: 1,
        threshold: 1,
        unit: '個',
        expiresAt: '',
        note: '',
      });
    } catch {
      setStatusMessage('在庫追加に失敗しました。Laravel API と MySQL を確認してください。');
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
      setStatusMessage('在庫を MySQL から削除しました。');
    } catch {
      setStatusMessage('削除に失敗しました。Laravel API と MySQL を確認してください。');
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Home Inventory</p>
          <h1>うちの在庫ノート</h1>
          <p className="hero-copy">
            家庭の食品と日用品を MySQL に一元保存。カテゴリや保管場所の選択肢も Laravel の seed データから読み込みます。
          </p>
          <p className="sync-badge api">{statusMessage}</p>
        </div>
        <div className="summary-grid">
          <article className="summary-card warm">
            <span>不足気味</span>
            <strong>{summary.lowStock}</strong>
            <small>買い足し候補</small>
          </article>
          <article className="summary-card cool">
            <span>7日以内</span>
            <strong>{summary.expiringSoon}</strong>
            <small>期限が近い在庫</small>
          </article>
          <article className="summary-card neutral">
            <span>総数量</span>
            <strong>{summary.totalQuantity}</strong>
            <small>家にある全在庫</small>
          </article>
        </div>
      </section>

      <section className="panel layout">
        <div className="panel form-panel">
          <div className="panel-heading">
            <h2>在庫を追加</h2>
            <p>マスタ選択肢も MySQL から取得</p>
          </div>
          <form className="stock-form" onSubmit={handleSubmit}>
            <label>
              品名
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="例: トイレットペーパー"
              />
            </label>
            <div className="two-columns">
              <label>
                カテゴリ
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
                  disabled={categories.length === 0}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                保管場所
                <select
                  value={form.storageLocationId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, storageLocationId: event.target.value }))
                  }
                  disabled={storageLocations.length === 0}
                >
                  {storageLocations.map((storageLocation) => (
                    <option key={storageLocation.id} value={storageLocation.id}>
                      {storageLocation.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="three-columns">
              <label>
                数量
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                />
              </label>
              <label>
                単位
                <input
                  value={form.unit}
                  onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                />
              </label>
              <label>
                下限
                <input
                  type="number"
                  min="0"
                  value={form.threshold}
                  onChange={(event) => setForm((current) => ({ ...current, threshold: Number(event.target.value) }))}
                />
              </label>
            </div>
            <div className="two-columns">
              <label>
                賞味・使用期限
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
                />
              </label>
              <label>
                メモ
                <input
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="特売日や銘柄など"
                />
              </label>
            </div>
            <button className="primary-button" type="submit" disabled={isLoading || categories.length === 0}>
              在庫に追加
            </button>
          </form>
        </div>

        <div className="content-stack">
          <div className="panel">
            <div className="toolbar">
              <div className="panel-heading">
                <h2>在庫一覧</h2>
                <p>{filteredItems.length}件を表示中</p>
              </div>
              <div className="toolbar-actions">
                <input
                  className="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="品名・メモ・カテゴリ・保管場所で検索"
                />
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  disabled={categories.length === 0}
                >
                  <option value="すべて">すべて</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="item-list">
              {filteredItems.map((item) => {
                const remaining = daysUntil(item.expiresAt);
                const lowStock = item.quantity <= item.threshold;
                const expiring = remaining !== null && remaining <= 7;

                return (
                  <article key={item.id} className="item-card">
                    <div className="item-main">
                      <div className="item-title-row">
                        <h3>{item.name}</h3>
                        <div className="tag-row">
                          <span className="tag">{item.categoryName}</span>
                          <span className="tag">{item.storageLocationName}</span>
                          {lowStock && <span className="tag alert">不足</span>}
                          {expiring && <span className="tag caution">期限近い</span>}
                        </div>
                      </div>
                      <p className="quantity">
                        {item.quantity} {item.unit}
                        <span>
                          {' '}
                          下限 {item.threshold}
                          {item.unit}
                        </span>
                      </p>
                      <p className="meta">
                        {item.expiresAt
                          ? remaining! < 0
                            ? `期限切れ ${Math.abs(remaining!)}日`
                            : `期限まであと${remaining}日`
                          : '期限設定なし'}
                      </p>
                      {item.note && <p className="note">{item.note}</p>}
                    </div>
                    <div className="item-actions">
                      <button type="button" onClick={() => void updateQuantity(item.id, -1)}>
                        -1
                      </button>
                      <button type="button" onClick={() => void updateQuantity(item.id, 1)}>
                        +1
                      </button>
                      <button type="button" className="ghost-danger" onClick={() => void handleDelete(item.id)}>
                        削除
                      </button>
                    </div>
                  </article>
                );
              })}
              {!isLoading && filteredItems.length === 0 && (
                <p className="empty-state">MySQL に在庫がまだありません。seed または追加フォームから登録してください。</p>
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <h2>買い物メモ</h2>
              <p>下限以下の在庫を MySQL から抽出</p>
            </div>
            <div className="shopping-list">
              {shoppingList.length === 0 ? (
                <p className="empty-state">今のところ補充が必要な在庫はありません。</p>
              ) : (
                shoppingList.map((item) => (
                  <div key={item.id} className="shopping-item">
                    <strong>{item.name}</strong>
                    <span>
                      残り {item.quantity}
                      {item.unit} / 目標 {item.threshold}
                      {item.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
