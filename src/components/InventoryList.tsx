import { MasterRecord, StockItem } from '../types';
import { daysUntil } from '../utils/inventory';
import {
  ActionButton,
  ItemActions,
  ItemCard,
  ItemList,
  ItemTitleRow,
  MutedText,
  NoteText,
  Panel,
  PanelHeading,
  QuantityText,
  Tag,
  TagRow,
  Toolbar,
  ToolbarActions,
  FieldInput,
  FieldSelect,
} from '../styles/appStyles';

type InventoryListProps = {
  categories: MasterRecord[];
  filteredItems: StockItem[];
  isLoading: boolean;
  search: string;
  selectedCategory: string;
  onDelete: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
};

export const InventoryList = ({
  categories,
  filteredItems,
  isLoading,
  search,
  selectedCategory,
  onDelete,
  onSearchChange,
  onSelectedCategoryChange,
  onUpdateQuantity,
}: InventoryListProps) => (
  <Panel>
    <Toolbar>
      <PanelHeading>
        <h2>在庫一覧</h2>
        <p>{filteredItems.length}件を表示中</p>
      </PanelHeading>
      <ToolbarActions>
        <FieldInput value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="品名・メモ・カテゴリ・保管場所で検索" />
        <FieldSelect value={selectedCategory} onChange={(event) => onSelectedCategoryChange(event.target.value)} disabled={categories.length === 0}>
          <option value="すべて">すべて</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </FieldSelect>
      </ToolbarActions>
    </Toolbar>

    <ItemList>
      {filteredItems.map((item) => {
        const remaining = daysUntil(item.expiresAt);
        const lowStock = item.quantity <= item.threshold;
        const expiring = remaining !== null && remaining <= 7;

        return (
          <ItemCard key={item.id}>
            <div>
              <ItemTitleRow>
                <h3>{item.name}</h3>
                <TagRow>
                  <Tag>{item.categoryName}</Tag>
                  <Tag>{item.storageLocationName}</Tag>
                  {lowStock && <Tag $tone="alert">不足</Tag>}
                  {expiring && <Tag $tone="caution">期限近い</Tag>}
                </TagRow>
              </ItemTitleRow>
              <QuantityText>
                {item.quantity} {item.unit}
                <span>
                  {' '}
                  下限 {item.threshold}
                  {item.unit}
                </span>
              </QuantityText>
              <MutedText>
                {item.expiresAt
                  ? remaining! < 0
                    ? `期限切れ ${Math.abs(remaining!)}日`
                    : `期限まであと${remaining}日`
                  : '期限設定なし'}
              </MutedText>
              {item.note && <NoteText>{item.note}</NoteText>}
            </div>
            <ItemActions>
              <ActionButton type="button" onClick={() => onUpdateQuantity(item.id, -1)}>
                -1
              </ActionButton>
              <ActionButton type="button" onClick={() => onUpdateQuantity(item.id, 1)}>
                +1
              </ActionButton>
              <ActionButton type="button" $danger onClick={() => onDelete(item.id)}>
                削除
              </ActionButton>
            </ItemActions>
          </ItemCard>
        );
      })}
      {!isLoading && filteredItems.length === 0 && (
        <MutedText>MySQL に在庫がまだありません。seed または追加フォームから登録してください。</MutedText>
      )}
    </ItemList>
  </Panel>
);
