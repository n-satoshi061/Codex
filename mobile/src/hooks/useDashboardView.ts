import { useState } from 'react';
import { DashboardView } from '../types';

export const useDashboardView = (initialView: DashboardView = 'inventory') => {
  const [activeView, setActiveView] = useState<DashboardView>(initialView);

  const openInventoryView = () => {
    setActiveView('inventory');
  };

  const openAddView = () => {
    setActiveView('add');
  };

  const openShoppingView = () => {
    setActiveView('shopping');
  };

  return {
    activeView,
    openAddView,
    openInventoryView,
    openShoppingView,
    setActiveView,
  };
};
