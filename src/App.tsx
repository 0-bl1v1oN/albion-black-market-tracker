import { useEffect, useMemo, useState } from 'react';
import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { ItemModal } from './components/ItemModal';
import { ItemsTable } from './components/ItemsTable';
import { StatsCards } from './components/StatsCards';
import type { CategoryFilter, EnchantFilter, ItemFormValues, MarketItem, SortOption, TierFilter } from './types/market';
import { calculateProfit, calculateRoi } from './utils/calculations';
import { loadItems, resetItems, saveItems } from './utils/storage';

const defaultSortOption: SortOption = 'updatedAtDesc';

const createItemFromForm = (values: ItemFormValues, id?: string): MarketItem => {
  const profit = calculateProfit(values.buyPrice, values.sellPrice);
  const roi = calculateRoi(values.buyPrice, values.sellPrice);

  return {
    ...values,
    id: id ?? crypto.randomUUID(),
    profit,
    roi,
    updatedAt: new Date().toISOString(),
  };
};

function App() {
  const [items, setItems] = useState<MarketItem[]>(() => loadItems());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketItem | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('Все');
  const [enchantFilter, setEnchantFilter] = useState<EnchantFilter>('Все');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Все');
  const [sortOption, setSortOption] = useState<SortOption>(defaultSortOption);

  useEffect(() => {
    saveItems(items);
  }, [items]);

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
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item: MarketItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveItem = (values: ItemFormValues) => {
    if (editingItem) {
      setItems((currentItems) => currentItems.map((item) => (item.id === editingItem.id ? createItemFromForm(values, item.id) : item)));
    } else {
      handleModalClose();
    }

    setItems((currentItems) => [createItemFromForm(values), ...currentItems]);
  };

  const handleDeleteItem = (itemId: string) => {
    const item = items.find((currentItem) => currentItem.id === itemId);
    const isConfirmed = confirm(`Удалить предмет «${item?.name ?? 'без названия'}»?`);

    if (!isConfirmed) {
      return;
    }

    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== itemId));

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

  const handleResetMockData = () => {
    const isConfirmed = confirm('Сбросить список к начальным моковым данным? Текущие локальные изменения будут удалены.');

    if (!isConfirmed) {
      return;
    }

    setItems(resetItems());
    handleModalClose();
  };

  return (
    <main className="app-shell">
      <Header />
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
        onResetMockData={handleResetMockData}
      />

      <div className="workspace-grid">
        <ItemsTable items={visibleItems} onEdit={handleEditClick} onDelete={handleDeleteItem} />
      </div>

      <ItemModal isOpen={isModalOpen} editingItem={editingItem} onSave={handleSaveItem} onClose={handleModalClose} />
    </main>
  );
}

export default App;