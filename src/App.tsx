import { useEffect, useMemo, useState } from 'react';
import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { ItemForm } from './components/ItemForm';
import { ItemsTable } from './components/ItemsTable';
import { StatsCards } from './components/StatsCards';
import type { CategoryFilter, ItemFormValues, MarketItem, SortOption, TierFilter } from './types/market';
import { calculateProfit, calculateRoi } from './utils/calculations';
import { loadItems, resetItems, saveItems } from './utils/storage';

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
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('Все');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Все');
  const [sortOption, setSortOption] = useState<SortOption>('profitDesc');

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...items]
      .filter((item) => item.name.toLowerCase().includes(normalizedSearch))
      .filter((item) => (tierFilter === 'Все' ? true : item.tier === tierFilter))
      .filter((item) => (categoryFilter === 'Все' ? true : item.category === categoryFilter))
      .sort((first, second) => {
        switch (sortOption) {
          case 'roiDesc':
            return second.roi - first.roi;
          case 'buyPriceAsc':
            return first.buyPrice - second.buyPrice;
          case 'sellPriceDesc':
            return second.sellPrice - first.sellPrice;
          case 'updatedAtDesc':
            return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
          case 'profitDesc':
          default:
            return second.profit - first.profit;
        }
      });
  }, [categoryFilter, items, search, sortOption, tierFilter]);

  const handleSaveItem = (values: ItemFormValues) => {
    if (selectedItemId) {
      setItems((currentItems) => currentItems.map((item) => (item.id === selectedItemId ? createItemFromForm(values, item.id) : item)));
      setSelectedItemId(null);
      return;
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

    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  const handleResetMockData = () => {
    const isConfirmed = confirm('Сбросить список к начальным моковым данным? Текущие локальные изменения будут удалены.');

    if (!isConfirmed) {
      return;
    }

    setItems(resetItems());
    setSelectedItemId(null);
  };

  return (
    <main className="app-shell">
      <Header />
      <StatsCards items={items} />
      <Controls
        search={search}
        tierFilter={tierFilter}
        categoryFilter={categoryFilter}
        sortOption={sortOption}
        onSearchChange={setSearch}
        onTierChange={setTierFilter}
        onCategoryChange={setCategoryFilter}
        onSortChange={setSortOption}
        onAddNew={() => setSelectedItemId(null)}
        onResetMockData={handleResetMockData}
      />

      <div className="workspace-grid">
        <ItemsTable items={visibleItems} selectedItemId={selectedItemId} onEdit={(item) => setSelectedItemId(item.id)} onDelete={handleDeleteItem} />
        <ItemForm selectedItem={selectedItem} onSave={handleSaveItem} onClearSelection={() => setSelectedItemId(null)} />
      </div>
    </main>
  );
}

export default App;