import { FormEvent } from 'react';
import { DashboardNavigation } from './components/DashboardNavigation';
import { HeroSection } from './components/HeroSection';
import { InventoryFormPage } from './components/InventoryFormPage';
import { InventoryPage } from './components/InventoryPage';
import { ShoppingMemoPage } from './components/ShoppingMemoPage';
import { useDashboardView } from './hooks/useDashboardView';
import { useInventoryDashboard } from './hooks/useInventoryDashboard';
import { AppShell, GlobalStyle, PageContent } from './styles/appStyles';

const App = () => {
  const { activeView, openAddView, openInventoryView, openShoppingView } = useDashboardView();
  const {
    cancelEditingItem,
    categories,
    deleteItem,
    editingItemId,
    filteredItems,
    groupedItems,
    form,
    formMode,
    isLoading,
    search,
    selectedCategory,
    setForm,
    setSearch,
    setSelectedCategory,
    shoppingList,
    startEditingItem,
    statusMessage,
    storageLocations,
    submitInventoryForm,
    summary,
    updateQuantity,
  } = useInventoryDashboard();

  const handleEditItem = (id: string) => {
    startEditingItem(id);
    openAddView();
  };

  const handleCancelEdit = () => {
    cancelEditingItem();
    openInventoryView();
  };

  const handleSubmitInventoryForm = async (event: FormEvent<HTMLFormElement>) => {
    const wasEditing = formMode === 'edit';
    const isSubmitted = await submitInventoryForm(event);

    if (isSubmitted && wasEditing) {
      openInventoryView();
    }
  };

  return (
    <>
      <GlobalStyle />
      <AppShell>
        <HeroSection statusMessage={statusMessage} summary={summary} />
        <DashboardNavigation
          activeView={activeView}
          onAddClick={openAddView}
          onInventoryClick={openInventoryView}
          onShoppingClick={openShoppingView}
        />
        <PageContent>
          {activeView === 'inventory' && (
            <InventoryPage
              categories={categories}
              editingItemId={editingItemId}
              groupedItems={groupedItems}
              isLoading={isLoading}
              search={search}
              selectedCategory={selectedCategory}
              onDelete={deleteItem}
              onEdit={handleEditItem}
              onSearchChange={setSearch}
              onSelectedCategoryChange={setSelectedCategory}
              onUpdateQuantity={updateQuantity}
            />
          )}
          {activeView === 'add' && (
            <InventoryFormPage
              categories={categories}
              formMode={formMode}
              form={form}
              isLoading={isLoading}
              storageLocations={storageLocations}
              onCancelEdit={handleCancelEdit}
              onChange={setForm}
              onSubmit={handleSubmitInventoryForm}
            />
          )}
          {activeView === 'shopping' && <ShoppingMemoPage items={shoppingList} />}
        </PageContent>
      </AppShell>
    </>
  );
};

export default App;
