import { ShoppingMemoItem } from '../types';
import { ShoppingMemo } from './ShoppingMemo';

type ShoppingMemoPageProps = {
  items: ShoppingMemoItem[];
};

export const ShoppingMemoPage = ({ items }: ShoppingMemoPageProps) => <ShoppingMemo items={items} />;
