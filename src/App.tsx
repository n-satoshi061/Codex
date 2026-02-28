import { HeroSection } from './components/HeroSection';
import { InventoryForm } from './components/InventoryForm';
import { InventoryList } from './components/InventoryList';
import { ShoppingMemo } from './components/ShoppingMemo';
import { AppShell, ContentStack, GlobalStyle, LayoutPanel } from './styles/appStyles';
import { useInventoryDashboard } from './hooks/useInventoryDashboard';

const App = () => {
  const {
    categories,
    deleteItem,
    filteredItems,
    form,
    isLoading,
    search,
    selectedCategory,
    setForm,
    setSearch,
    setSelectedCategory,
    shoppingList,
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
            form={form}
            isLoading={isLoading}
            storageLocations={storageLocations}
            onChange={setForm}
            onSubmit={submitInventoryForm}
          />
          <ContentStack>
            <InventoryList
              categories={categories}
              filteredItems={filteredItems}
              isLoading={isLoading}
              search={search}
              selectedCategory={selectedCategory}
              onDelete={deleteItem}
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
