import { StockItem } from '../types';
import { MutedText, Panel, PanelHeading, ShoppingItemRow, ShoppingList } from '../styles/appStyles';

type ShoppingMemoProps = {
  items: StockItem[];
};

export const ShoppingMemo = ({ items }: ShoppingMemoProps) => (
  <Panel>
    <PanelHeading>
      <h2>買い物メモ</h2>
      <p>下限以下の在庫を MySQL から抽出</p>
    </PanelHeading>
    <ShoppingList>
      {items.length === 0 ? (
        <MutedText>今のところ補充が必要な在庫はありません。</MutedText>
      ) : (
        items.map((item) => (
          <ShoppingItemRow key={item.id}>
            <strong>{item.name}</strong>
            <MutedText>
              残り {item.quantity}
              {item.unit} / 目標 {item.threshold}
              {item.unit}
            </MutedText>
          </ShoppingItemRow>
        ))
      )}
    </ShoppingList>
  </Panel>
);
