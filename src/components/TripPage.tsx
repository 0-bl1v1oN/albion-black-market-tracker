import { useMemo, useState } from 'react';
import { createRun } from '../api/runsApi';
import { itemCategories } from './Controls';
import { TripCart } from './TripCart';
import { addCachedRun } from '../utils/storage';
import { useTripCart } from '../hooks/useTripCart';
import type { CategoryFilter, EnchantFilter, MarketItem, SortOption, TierFilter } from '../types/market';
import { formatPrice, formatRoi, getProfitClassName } from '../utils/format';

const categories: CategoryFilter[] = ['Все', ...itemCategories];
const tiers: TierFilter[] = ['Все', 6, 7, 8];
const enchants: EnchantFilter[] = ['Все', 0, 1, 2, 3, 4];

interface TripPageProps {
  items: MarketItem[];
  initialLoading: boolean;
  hasError: boolean;
  isRemoteConfigured: boolean;
  onRunCompleted?: () => void;
}

export const TripPage = ({ items, initialLoading, hasError, isRemoteConfigured, onRunCompleted }: TripPageProps) => {
  const { cartItems, totals, addItem, updateItem, removeItem, clearCart } = useTripCart();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('Все');
  const [enchantFilter, setEnchantFilter] = useState<EnchantFilter>('Все');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Все');
  const [sortOption, setSortOption] = useState<SortOption>('updatedAtDesc');
  const [createdBy, setCreatedBy] = useState('');
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleResetFilters = () => {
    setSearch('');
    setTierFilter('Все');
    setEnchantFilter('Все');
    setCategoryFilter('Все');
    setSortOption('updatedAtDesc');
  };

  const handleClearCart = () => {
    if (cartItems.length === 0 || confirm('Очистить текущую корзину ходки?')) {
      clearCart();
    }
  };

  const handleCompleteRun = async () => {
    if (cartItems.length === 0) {
      setError('Добавьте хотя бы один предмет в корзину.');
      return;
    }

    if (!isRemoteConfigured) {
      setError('VITE_APPS_SCRIPT_URL не задан. Завершение ходки доступно только через Google Apps Script.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const createdRun = await createRun({
        createdBy: createdBy.trim() || 'Не указано',
        comment: comment.trim(),
        items: cartItems,
      });
      addCachedRun(createdRun);
      clearCart();
      setComment('');
      setMessage('Ходка успешно сохранена. Корзина очищена.');
      onRunCompleted?.();
    } catch (saveError) {
      const saveMessage = saveError instanceof Error ? saveError.message : 'Не удалось завершить ходку.';
      setError(saveMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getEmptyMessage = () => {
    if (initialLoading) {
      return 'Загружаем базу...';
    }

    if (hasError && items.length === 0) {
      return 'Не удалось загрузить базу предметов. Проверьте синхронизацию на вкладке предметов.';
    }

    if (items.length === 0) {
      return 'В базе пока нет предметов.';
    }

    return 'Ничего не найдено. Измените фильтры.';
  };

  return (
    <div className="trip-page">
      {message && <div className="app-warning app-success" role="status">{message}</div>}
      {error && <div className="app-warning app-warning-error" role="alert">{error}</div>}

      <section className="controls-panel trip-controls" aria-label="Фильтры выбора предметов для ходки">
        <label className="field field-search">
          <span>Поиск по названию</span>
          <input value={search} type="search" onChange={(event) => setSearch(event.target.value)} placeholder="Например, Куртка" />
        </label>
        <label className="field">
          <span>Тир</span>
          <select value={tierFilter} onChange={(event) => setTierFilter(event.target.value === 'Все' ? 'Все' : (Number(event.target.value) as TierFilter))}>
            {tiers.map((tier) => (
              <option key={tier} value={tier}>{tier === 'Все' ? 'Все' : `T${tier}`}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Зачар</span>
          <select value={enchantFilter} onChange={(event) => setEnchantFilter(event.target.value === 'Все' ? 'Все' : (Number(event.target.value) as EnchantFilter))}>
            {enchants.map((enchant) => (
              <option key={enchant} value={enchant}>{enchant === 'Все' ? 'Все' : `.${enchant}`}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Категория</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="field field-sort">
          <span>Сортировка</span>
          <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
            <option value="updatedAtDesc">Недавно обновленные</option>
            <option value="profitDesc">Профит по убыванию</option>
            <option value="roiDesc">ROI по убыванию</option>
            <option value="buyPriceAsc">Цена покупки по возрастанию</option>
            <option value="sellPriceDesc">Цена продажи по убыванию</option>
          </select>
        </label>
        <div className="controls-actions">
          <button className="button button-secondary" type="button" onClick={handleResetFilters}>Сброс</button>
        </div>
      </section>

      <div className="trip-layout">
        <section className="table-card trip-picker-card" aria-label="База предметов для ходки">
          <div className="table-heading">
            <div>
              <h2>Выбор предметов</h2>
              <p>Добавляйте позиции в текущую ходку</p>
            </div>
            <span>{initialLoading ? 'Загрузка...' : `${visibleItems.length} найдено`}</span>
          </div>
          <div className="table-scroll">
            <table className="trip-picker-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Тир</th>
                  <th>Зачар</th>
                  <th>Категория</th>
                  <th>Покупка</th>
                  <th>Продажа</th>
                  <th>Профит</th>
                  <th>ROI</th>
                  <th aria-label="Действие"></th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.length === 0 ? (
                  <tr>
                    <td className="empty-table" colSpan={9}>{getEmptyMessage()}</td>
                  </tr>
                ) : (
                  visibleItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-name-cell" title={item.name}><strong>{item.name}</strong></td>
                      <td>T{item.tier}</td>
                      <td>{item.enchant === 0 ? '0' : `.${item.enchant}`}</td>
                      <td>{item.category}</td>
                      <td>{formatPrice(item.buyPrice)}</td>
                      <td>{formatPrice(item.sellPrice)}</td>
                      <td className={getProfitClassName(item.profit)}>{formatPrice(item.profit)}</td>
                      <td className={getProfitClassName(item.roi)}>{formatRoi(item.roi)}</td>
                      <td>
                        <div className="table-actions">
                          <button type="button" onClick={() => addItem(item)}>Добавить</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <TripCart
          cartItems={cartItems}
          totals={totals}
          createdBy={createdBy}
          comment={comment}
          isSaving={isSaving}
          onCreatedByChange={setCreatedBy}
          onCommentChange={setComment}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
          onClearCart={handleClearCart}
          onCompleteRun={handleCompleteRun}
        />
      </div>
    </div>
  );
};
