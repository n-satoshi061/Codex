import { FormEvent, useEffect, useState } from 'react';

type Category = '食品' | '飲料' | '日用品' | '衛生用品' | 'ペット用品' | 'その他';
type Storage = '冷蔵' | '冷凍' | '常温' | '洗面所' | '収納棚';

type StockItem = {
  id: string;
  name: string;
  category: Category;
  storage: Storage;
  quantity: number;
  threshold: number;
  unit: string;
  expiresAt: string;
  updatedAt: string;
  note: string;
};

const STORAGE_KEY = 'home-stock-manager-items';

const initialItems: StockItem[] = [
  {
    id: 'rice',
    name: 'お米',
    category: '食品',
    storage: '常温',
    quantity: 3,
    threshold: 1,
    unit: '袋',
    expiresAt: '',
    updatedAt: new Date().toISOString(),
    note: '5kgを目安に管理',
  },
  {
    id: 'water',
    name: '水',
    category: '飲料',
    storage: '収納棚',
    quantity: 8,
    threshold: 4,
    unit: '本',
    expiresAt: '',
    updatedAt: new Date().toISOString(),
    note: '防災備蓄を兼ねる',
  },
  {
    id: 'detergent',
    name: '洗濯洗剤',
    category: '日用品',
    storage: '洗面所',
    quantity: 2,
    threshold: 1,
    unit: '個',
    expiresAt: '',
    updatedAt: new Date().toISOString(),
    note: '',
  },
];

const categories: Category[] = ['食品', '飲料', '日用品', '衛生用品', 'ペット用品', 'その他'];
const storages: Storage[] = ['冷蔵', '冷凍', '常温', '洗面所', '収納棚'];

const blankForm = {
  name: '',
  category: '食品' as Category,
  storage: '常温' as Storage,
  quantity: 1,
  threshold: 1,
  unit: '個',
  expiresAt: '',
  note: '',
};

function daysUntil(dateString: string) {
  if (!dateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function App() {
  const [items, setItems] = useState<StockItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialItems;

    try {
      const parsed = JSON.parse(stored) as StockItem[];
      return parsed.length > 0 ? parsed : initialItems;
    } catch {
      return initialItems;
    }
  });
  const [selectedCategory, setSelectedCategory] = useState<'すべて' | Category>('すべて');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(blankForm);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = items
    .filter((item) => selectedCategory === 'すべて' || item.category === selectedCategory)
    .filter((item) => {
      const query = search.trim().toLowerCase();
      return !query || `${item.name} ${item.note} ${item.storage}`.toLowerCase().includes(query);
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

  function updateQuantity(id: string, delta: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(0, item.quantity + delta),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;

    const newItem: StockItem = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      category: form.category,
      storage: form.storage,
      quantity: Number(form.quantity),
      threshold: Number(form.threshold),
      unit: form.unit.trim() || '個',
      expiresAt: form.expiresAt,
      updatedAt: new Date().toISOString(),
      note: form.note.trim(),
    };

    setItems((current) => [newItem, ...current]);
    setForm(blankForm);
  }

  function handleDelete(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Home Inventory</p>
          <h1>うちの在庫ノート</h1>
          <p className="hero-copy">
            食品も日用品も、家庭で管理しやすい単位で見える化。残量不足と期限切れ前を先回りで拾います。
          </p>
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
            <p>買ってきた物をその場で登録</p>
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
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value as Category }))
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                保管場所
                <select
                  value={form.storage}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, storage: event.target.value as Storage }))
                  }
                >
                  {storages.map((storage) => (
                    <option key={storage} value={storage}>
                      {storage}
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
            <button className="primary-button" type="submit">
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
                  placeholder="品名・メモ・保管場所で検索"
                />
                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value as 'すべて' | Category)}>
                  <option value="すべて">すべて</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
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
                          <span className="tag">{item.category}</span>
                          <span className="tag">{item.storage}</span>
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
                      <button onClick={() => updateQuantity(item.id, -1)}>-1</button>
                      <button onClick={() => updateQuantity(item.id, 1)}>+1</button>
                      <button className="ghost-danger" onClick={() => handleDelete(item.id)}>
                        削除
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <h2>買い物メモ</h2>
              <p>下限以下の在庫を自動抽出</p>
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
