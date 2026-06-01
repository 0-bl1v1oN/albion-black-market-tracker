import { useMemo, useState } from 'react';
import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { ItemModal } from './components/ItemModal';
import { ItemsTable } from './components/ItemsTable';
import { StatsCards } from './components/StatsCards';
import { useMarketItems } from './hooks/useMarketItems';
import type { CategoryFilter, EnchantFilter, ItemFormValues, MarketItem, SortOption, TierFilter } from './types/market';

const defaultSortOption: SortOption = 'updatedAtDesc';
type ModalMode = 'create' | 'edit';

function App() {
  const {
    items,
    initialLoading,
    error,
    isAutoRefreshEnabled,
    isRemoteConfigured,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    toggleAutoRefresh,
  } = useMarketItems();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('Все');
  const [enchantFilter, setEnchantFilter] = useState<EnchantFilter>('Все');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Все');
  const [sortOption, setSortOption] = useState<SortOption>(defaultSortOption);

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...items]
      .filter((item) => item.name.toLowerCase().includes(normalizedSearch))
      .filter((item) => (tierFilter === 'Все' ? true : item.tier === tierFilter))
      .filter((item) => (enchantFilter === 'Все' ? true : item.enchant === enchantFilter))
      .filter((item) => (categoryFilter === 'Все' ? true : item.category === categoryFilter))
      .sort((first, second) => {
        switch (sortOption) {
          case 'roiDesc':
            return second.roi - first.roi;
          case 'buyPriceAsc':
            return first.buyPrice - second.buyPrice;
          case 'sellPriceDesc':
            return second.sellPrice - first.sellPrice;
          case 'profitDesc':
            return second.profit - first.profit;
          case 'updatedAtDesc':
          default:
            return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
        }
      });
  }, [categoryFilter, enchantFilter, items, search, sortOption, tierFilter]);

  const handleAddClick = () => {
    setModalMode('create');
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: MarketItem) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setModalMode('create');
  };

  const handleSaveItem = async (values: ItemFormValues) => {
    if (modalMode === 'edit' && editingItem) {
      await updateItem(editingItem.id, values);
    } else {
      await createItem(values);
    }

    handleModalClose();
  };

  const handleDeleteItem = async (itemId: string) => {
    const item = items.find((currentItem) => currentItem.id === itemId);
    const isConfirmed = confirm(`Удалить предмет «${item?.name ?? 'без названия'}»?`);

    if (!isConfirmed) {
      return;
    }

    await deleteItem(itemId);

    if (editingItem?.id === itemId) {
      handleModalClose();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTierFilter('Все');
    setEnchantFilter('Все');
    setCategoryFilter('Все');
    setSortOption(defaultSortOption);
  };

  return (
    <main className="app-shell">
      <Header error={error} isAutoRefreshEnabled={isAutoRefreshEnabled} />

      {!isRemoteConfigured && (
        <div className="app-warning" role="alert">
          VITE_APPS_SCRIPT_URL не задан. Приложение временно работает на локальном fallback, а Google Таблица не обновляется.
        </div>
      )}

      {isRemoteConfigured && error && (
        <div className="app-warning app-warning-error" role="alert">
          {error}
        </div>
      )}
      <StatsCards items={items} />
      <Controls
        search={search}
        tierFilter={tierFilter}
        enchantFilter={enchantFilter}
        categoryFilter={categoryFilter}
        sortOption={sortOption}
        onSearchChange={setSearch}
        onTierChange={setTierFilter}
        onEnchantChange={setEnchantFilter}
        onCategoryChange={setCategoryFilter}
        onSortChange={setSortOption}
        onResetFilters={handleResetFilters}
        onAddNew={handleAddClick}
        onRefresh={() => void loadItems().catch(() => undefined)}
        isAutoRefreshEnabled={isAutoRefreshEnabled}
        onToggleAutoRefresh={toggleAutoRefresh}
      />

      {initialLoading && items.length === 0 && <div className="app-loading">Загрузка данных...</div>}

      <div className="workspace-grid">
        <ItemsTable items={visibleItems} onEdit={handleEditClick} onDelete={(itemId) => void handleDeleteItem(itemId)} />
      </div>

      <ItemModal
        isOpen={isModalOpen}
        modalMode={modalMode}
        editingItem={editingItem}
        onSave={handleSaveItem}
        onClose={handleModalClose}
      />
    </main>
  );
}

export default App;