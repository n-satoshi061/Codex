import { DashboardView } from '../types';
import {
  NavButton,
  PageNavigation,
  PageNavigationGroup,
  PageTitle,
} from '../styles/appStyles';

type DashboardNavigationProps = {
  activeView: DashboardView;
  onAddClick: () => void;
  onInventoryClick: () => void;
  onShoppingClick: () => void;
};

const pageTitle: Record<DashboardView, string> = {
  inventory: '在庫一覧',
  add: '在庫追加',
  shopping: '買い物メモ',
};

export const DashboardNavigation = ({
  activeView,
  onAddClick,
  onInventoryClick,
  onShoppingClick,
}: DashboardNavigationProps) => (
  <PageNavigation>
    <PageNavigationGroup>
      <PageTitle>{pageTitle[activeView]}</PageTitle>
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
);
