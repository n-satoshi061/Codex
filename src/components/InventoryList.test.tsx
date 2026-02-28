import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { groupedItemsFixture, metadataFixture, stockItemsFixture } from '../test/fixtures';
import { InventoryList } from './InventoryList';

describe('InventoryList', () => {
  it('在庫情報と注意タグを表示する', () => {
    render(
      <InventoryList
        categories={metadataFixture.categories}
        editingItemId={null}
        groupedItems={groupedItemsFixture}
        isLoading={false}
        search=""
        selectedCategory="すべて"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectedCategoryChange={vi.fn()}
        onUpdateQuantity={vi.fn()}
      />,
    );

    expect(screen.getByText('お米')).toBeInTheDocument();
    expect(screen.getByText('不足')).toBeInTheDocument();
    expect(screen.getByText('期限近い')).toBeInTheDocument();
  });

  it('単一在庫は明細を開かなくても操作ボタンを表示する', () => {
    render(
      <InventoryList
        categories={metadataFixture.categories}
        editingItemId={null}
        groupedItems={[groupedItemsFixture[0]]}
        isLoading={false}
        search=""
        selectedCategory="すべて"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectedCategoryChange={vi.fn()}
        onUpdateQuantity={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: '期限別の明細を見る' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '-1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
  });

  it('明細を開いて操作ボタンでコールバックを呼び出す', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const groupedRiceItems = [
      {
        ...stockItemsFixture[0],
        id: 'item-rice-early',
        expiresAt: '2026-03-02',
        daysUntilExpiration: 2,
        isExpiringSoon: true,
      },
      {
        ...stockItemsFixture[0],
        id: 'item-rice-late',
        expiresAt: '2026-03-06',
        daysUntilExpiration: 6,
        isExpiringSoon: true,
      },
    ];

    render(
      <InventoryList
        categories={metadataFixture.categories}
        editingItemId={null}
        groupedItems={[
          {
            ...groupedItemsFixture[0],
            quantity: 2,
            registeredQuantity: 2,
            threshold: 4,
            entryCount: 2,
            nearestExpiresAt: '2026-03-02',
            nearestExpirationDays: 2,
            expiringSoon: true,
            items: groupedRiceItems,
          },
        ]}
        isLoading={false}
        search=""
        selectedCategory="すべて"
        onDelete={onDelete}
        onEdit={onEdit}
        onSearchChange={vi.fn()}
        onSelectedCategoryChange={vi.fn()}
        onUpdateQuantity={onUpdateQuantity}
      />,
    );

    await user.click(screen.getByRole('button', { name: '期限別の明細を見る' }));
    await user.click(screen.getAllByRole('button', { name: '編集' })[0]);
    await user.click(screen.getAllByRole('button', { name: '+1' })[0]);
    await user.click(screen.getAllByRole('button', { name: '削除' })[0]);

    expect(onEdit).toHaveBeenCalledWith('item-rice-early');
    expect(onUpdateQuantity).toHaveBeenCalledWith('item-rice-early', 1);
    expect(onDelete).toHaveBeenCalledWith('item-rice-early');
  });

  it('空状態と入力イベントを表示する', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onSelectedCategoryChange = vi.fn();

    render(
      <InventoryList
        categories={metadataFixture.categories}
        editingItemId="item-soap"
        groupedItems={[]}
        isLoading={false}
        search=""
        selectedCategory="すべて"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onSearchChange={onSearchChange}
        onSelectedCategoryChange={onSelectedCategoryChange}
        onUpdateQuantity={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('品名・メモ・カテゴリ・保管場所で検索'), '水');
    await user.selectOptions(screen.getByDisplayValue('すべて'), 'cat-food');

    expect(screen.getByText('表示できる在庫がまだありません。追加フォームから登録してください。')).toBeInTheDocument();
    expect(onSearchChange).toHaveBeenCalled();
    expect(onSelectedCategoryChange).toHaveBeenCalledWith('cat-food');
  });
});
