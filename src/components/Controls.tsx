import type { CategoryFilter, ItemCategory, SortOption, TierFilter } from '../types/market';

const categories: CategoryFilter[] = ['Все', 'Оружие', 'Броня', 'Шлем', 'Обувь', 'Сумка', 'Другое'];
const tiers: TierFilter[] = ['Все', 6, 7, 8];

interface ControlsProps {
  search: string;
  tierFilter: TierFilter;
  categoryFilter: CategoryFilter;
  sortOption: SortOption;
  onSearchChange: (value: string) => void;
  onTierChange: (value: TierFilter) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onSortChange: (value: SortOption) => void;
  onAddNew: () => void;
  onResetMockData: () => void;
}

export const Controls = ({
  search,
  tierFilter,
  categoryFilter,
  sortOption,
  onSearchChange,
  onTierChange,
  onCategoryChange,
  onSortChange,
  onAddNew,
  onResetMockData,
}: ControlsProps) => {
  return (
    <section className="controls-panel" aria-label="Панель управления">
      <label className="field field-search">
        <span>Поиск по названию</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Например, Куртка"
        />
      </label>

      <label className="field">
        <span>Тир</span>
        <select value={tierFilter} onChange={(event) => onTierChange(event.target.value === 'Все' ? 'Все' : (Number(event.target.value) as TierFilter))}>
          {tiers.map((tier) => (
            <option key={tier} value={tier}>
              {tier === 'Все' ? 'Все' : `T${tier}`}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Категория</span>
        <select value={categoryFilter} onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)}>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="field field-sort">
        <span>Сортировка</span>
        <select value={sortOption} onChange={(event) => onSortChange(event.target.value as SortOption)}>
          <option value="profitDesc">Профит по убыванию</option>
          <option value="roiDesc">ROI по убыванию</option>
          <option value="buyPriceAsc">Цена покупки по возрастанию</option>
          <option value="sellPriceDesc">Цена продажи по убыванию</option>
          <option value="updatedAtDesc">Недавно обновленные</option>
        </select>
      </label>

      <div className="controls-actions">
        <button className="button button-primary" type="button" onClick={onAddNew}>
          Добавить предмет
        </button>
        <button className="button button-secondary" type="button" onClick={onResetMockData}>
          Сбросить моковые данные
        </button>
      </div>
    </section>
  );
};

export const itemCategories = categories.filter((category): category is ItemCategory => category !== 'Все');