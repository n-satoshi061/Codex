import { HeroSection } from './components/HeroSection';
import { InventoryForm } from './components/InventoryForm';
import { InventoryList } from './components/InventoryList';
import { ShoppingMemo } from './components/ShoppingMemo';
import { AppShell, ContentStack, GlobalStyle, LayoutPanel } from './styles/appStyles';
import { useInventoryDashboard } from './hooks/useInventoryDashboard';

const App = () => {
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

  return (
    <>
      <GlobalStyle />
      <AppShell>
        <HeroSection statusMessage={statusMessage} summary={summary} />
        <LayoutPanel>
          <InventoryForm
            categories={categories}
            formMode={formMode}
            form={form}
            isLoading={isLoading}
            storageLocations={storageLocations}
            onCancelEdit={cancelEditingItem}
            onChange={setForm}
            onSubmit={submitInventoryForm}
          />
          <ContentStack>
            <InventoryList
              categories={categories}
              editingItemId={editingItemId}
              groupedItems={groupedItems}
              isLoading={isLoading}
              search={search}
              selectedCategory={selectedCategory}
              onDelete={deleteItem}
              onEdit={startEditingItem}
              onSearchChange={setSearch}
              onSelectedCategoryChange={setSelectedCategory}
              onUpdateQuantity={updateQuantity}
            />
            <ShoppingMemo items={shoppingList} />
          </ContentStack>
        </LayoutPanel>
      </AppShell>
    </>
  );
};

export default App;
