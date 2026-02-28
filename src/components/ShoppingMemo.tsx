import { ShoppingMemoItem } from '../types';
import { MutedText, Panel, PanelHeading, ShoppingItemRow, ShoppingList } from '../styles/appStyles';

type ShoppingMemoProps = {
  items: ShoppingMemoItem[];
};

export const ShoppingMemo = ({ items }: ShoppingMemoProps) => (
  <Panel>
    <PanelHeading>
      <h2>買い物メモ</h2>
      <p>買い足しが必要なものをまとめて表示</p>
    </PanelHeading>
    <ShoppingList>
      {items.length === 0 ? (
        <MutedText>今のところ補充が必要な在庫はありません。</MutedText>
      ) : (
        items.map((item) => (
          <ShoppingItemRow key={item.name}>
            <strong>{item.name}</strong>
            <MutedText>
              残り {item.quantity}
              {item.unit} / 合計目標 {item.threshold}
              {item.unit}
              {item.expiredQuantity > 0 ? ` / 期限切れ除外 ${item.expiredQuantity}${item.unit}` : ''}
            </MutedText>
          </ShoppingItemRow>
        ))
      )}
    </ShoppingList>
  </Panel>
);
