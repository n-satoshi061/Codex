import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { metadataFixture, stockItemsFixture } from '../test/fixtures';
import { InventoryList } from './InventoryList';

describe('InventoryList', () => {
  it('在庫情報と注意タグを表示する', () => {
    render(
      <InventoryList
        categories={metadataFixture.categories}
        filteredItems={stockItemsFixture}
        isLoading={false}
        search=""
        selectedCategory="すべて"
        onDelete={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectedCategoryChange={vi.fn()}
        onUpdateQuantity={vi.fn()}
      />,
    );

    expect(screen.getByText('お米')).toBeInTheDocument();
    expect(screen.getByText('不足')).toBeInTheDocument();
    expect(screen.getByText('期限近い')).toBeInTheDocument();
  });

  it('操作ボタンでコールバックを呼び出す', async () => {
    const user = userEvent.setup();
    const onUpdateQuantity = vi.fn();
    const onDelete = vi.fn();

    render(
      <InventoryList
        categories={metadataFixture.categories}
        filteredItems={[stockItemsFixture[0]]}
        isLoading={false}
        search=""
        selectedCategory="すべて"
        onDelete={onDelete}
        onSearchChange={vi.fn()}
        onSelectedCategoryChange={vi.fn()}
        onUpdateQuantity={onUpdateQuantity}
      />,
    );

    await user.click(screen.getByRole('button', { name: '+1' }));
    await user.click(screen.getByRole('button', { name: '削除' }));

    expect(onUpdateQuantity).toHaveBeenCalledWith('item-rice', 1);
    expect(onDelete).toHaveBeenCalledWith('item-rice');
  });

  it('空状態と入力イベントを表示する', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onSelectedCategoryChange = vi.fn();

    render(
      <InventoryList
        categories={metadataFixture.categories}
        filteredItems={[]}
        isLoading={false}
        search=""
        selectedCategory="すべて"
        onDelete={vi.fn()}
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
