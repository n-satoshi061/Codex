import { DashboardView } from '../types';
import {
  NavButton,
  PageIntro,
  PageIntroText,
  PageNavigation,
  PageNavigationGroup,
} from '../styles/appStyles';

type DashboardNavigationProps = {
  activeView: DashboardView;
  onAddClick: () => void;
  onInventoryClick: () => void;
  onShoppingClick: () => void;
};

const pageCopy: Record<DashboardView, { title: string; description: string }> = {
  inventory: {
    title: '在庫一覧',
    description: '毎日見る画面です。検索、絞り込み、期限別明細、数量更新をここに集約します。',
  },
  add: {
    title: '在庫追加',
    description: '登録と編集に集中する画面です。入力欄を広く取り、迷わず作業できる構成にします。',
  },
  shopping: {
    title: '買い物メモ',
    description: '補充が必要な品目だけを確認する画面です。買い物時に一覧を見返さずに済みます。',
  },
};

export const DashboardNavigation = ({
  activeView,
  onAddClick,
  onInventoryClick,
  onShoppingClick,
}: DashboardNavigationProps) => (
  <>
    <PageNavigation>
      <PageNavigationGroup>
        <NavButton type="button" $active={activeView === 'inventory'} onClick={onInventoryClick}>
          在庫一覧
        </NavButton>
        <NavButton type="button" $active={activeView === 'add'} onClick={onAddClick}>
          在庫追加
        </NavButton>
        <NavButton type="button" $active={activeView === 'shopping'} onClick={onShoppingClick}>
          買い物メモ
        </NavButton>
      </PageNavigationGroup>
    </PageNavigation>
    <PageIntro>
      <h2>{pageCopy[activeView].title}</h2>
      <PageIntroText>{pageCopy[activeView].description}</PageIntroText>
    </PageIntro>
  </>
);
