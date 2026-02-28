import { useState } from 'react';
import { GroupedStockItem, MasterRecord } from '../types';
import { daysUntil } from '../utils/inventory';
import {
  ActionButton,
  DetailCard,
  DetailList,
  DetailToggle,
  FieldInput,
  FieldSelect,
  GroupMetaRow,
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
} from '../styles/appStyles';

type InventoryListProps = {
  categories: MasterRecord[];
  editingItemId: string | null;
  groupedItems: GroupedStockItem[];
  isLoading: boolean;
  search: string;
  selectedCategory: string;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSelectedCategoryChange: (value: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
};

export const InventoryList = ({
  categories,
  editingItemId,
  groupedItems,
  isLoading,
  search,
  selectedCategory,
  onDelete,
  onEdit,
  onSearchChange,
  onSelectedCategoryChange,
  onUpdateQuantity,
}: InventoryListProps) => {
  const [expandedNames, setExpandedNames] = useState<string[]>([]);

  const toggleExpanded = (name: string) => {
    setExpandedNames((current) =>
      current.includes(name) ? current.filter((value) => value !== name) : [...current, name],
    );
  };

  return (
    <Panel>
      <Toolbar>
        <PanelHeading>
          <h2>在庫一覧</h2>
          <p>{groupedItems.length}件を表示中</p>
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
        {groupedItems.map((group) => {
          const remaining = daysUntil(group.nearestExpiresAt);
          const expanded = expandedNames.includes(group.name);
          const showDetails = expanded || group.entryCount === 1;

          return (
            <ItemCard key={group.name} $active={group.items.some((item) => item.id === editingItemId)}>
              <div>
                <ItemTitleRow>
                  <h3>{group.name}</h3>
                  <TagRow>
                  <Tag>{group.categoryName}</Tag>
                  <Tag>{group.storageLocationName}</Tag>
                  {group.lowStock && <Tag $tone="alert">不足</Tag>}
                  {group.hasExpiredItems && <Tag $tone="alert">期限切れあり</Tag>}
                  {group.expiringSoon && <Tag $tone="caution">期限近い</Tag>}
                </TagRow>
              </ItemTitleRow>
                <QuantityText>
                  {group.quantity} {group.unit}
                  <span>
                    {' '}
                    登録 {group.registeredQuantity}
                    {group.unit} / 
                    合計下限 {group.threshold}
                    {group.unit}
                  </span>
                </QuantityText>
                <GroupMetaRow>
                  <MutedText>
                    {group.entryCount}件の在庫
                    {group.expiredCount > 0 ? ` / 期限切れ ${group.expiredCount}件` : ''}
                    {group.nearestExpiresAt
                      ? remaining! < 0
                        ? ` / 最短期限は${Math.abs(remaining!)}日超過`
                        : ` / 最短期限まであと${remaining}日`
                      : ' / 期限設定なし'}
                  </MutedText>
                  {group.entryCount > 1 && (
                    <DetailToggle type="button" onClick={() => toggleExpanded(group.name)}>
                      {expanded ? '期限別の明細を閉じる' : '期限別の明細を見る'}
                    </DetailToggle>
                  )}
                </GroupMetaRow>
                {group.note && <NoteText>{group.note}</NoteText>}
                {showDetails && (
                  <DetailList>
                    {group.items.map((item) => {
                      const itemRemaining = daysUntil(item.expiresAt);

                      return (
                        <DetailCard key={item.id}>
                          <QuantityText>
                            {(itemRemaining !== null && itemRemaining < 0 ? 0 : item.quantity)} {item.unit}
                            <span>
                              {' '}
                              登録 {item.quantity}
                              {item.unit} / 
                              下限 {item.threshold}
                              {item.unit}
                            </span>
                          </QuantityText>
                          <MutedText>
                            {item.expiresAt
                              ? itemRemaining! < 0
                                ? `期限切れ ${Math.abs(itemRemaining!)}日 / 在庫数には含めません`
                                : `期限まであと${itemRemaining}日`
                              : '期限設定なし'}
                          </MutedText>
                          {item.note && <NoteText>{item.note}</NoteText>}
                          <ItemActions>
                            <ActionButton type="button" onClick={() => onEdit(item.id)}>
                              {editingItemId === item.id ? '編集中' : '編集'}
                            </ActionButton>
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
                        </DetailCard>
                      );
                    })}
                  </DetailList>
                )}
              </div>
            </ItemCard>
          );
        })}
        {!isLoading && groupedItems.length === 0 && (
          <MutedText>表示できる在庫がまだありません。追加フォームから登録してください。</MutedText>
        )}
      </ItemList>
    </Panel>
  );
};
