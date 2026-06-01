import type { MarketItem } from '../types/market';
import { getAverageProfit, getBestItem, getLatestUpdatedAt } from '../utils/calculations';
import { formatDateTime, formatPrice, getProfitClassName } from '../utils/format';

interface StatsCardsProps {
  items: MarketItem[];
  initialLoading: boolean;
}

export const StatsCards = ({ items, initialLoading }: StatsCardsProps) => {
  const averageProfit = getAverageProfit(items);
  const bestItem = getBestItem(items);
  const latestUpdatedAt = getLatestUpdatedAt(items);

  if (initialLoading && items.length === 0) {
    return (
      <section className="stats-grid" aria-label="Статистика торговли">
        <article className="stat-card">
          <span>Всего предметов</span>
          <strong>Загрузка...</strong>
          <p>Загружаем базу предметов</p>
        </article>
        <article className="stat-card">
          <span>Средний профит</span>
          <strong>Загрузка...</strong>
          <p>Появится после первой синхронизации</p>
        </article>
        <article className="stat-card">
          <span>Лучший предмет</span>
          <strong>Загрузка...</strong>
          <p>Появится после первой синхронизации</p>
        </article>
        <article className="stat-card">
          <span>Обновлено</span>
          <strong>Загрузка...</strong>
          <p>Ждем ответ Google Таблицы</p>
        </article>
      </section>
    );
  }

  return (
    <section className="stats-grid" aria-label="Статистика торговли">
      <article className="stat-card">
        <span>Всего предметов</span>
        <strong>{items.length}</strong>
        <p>Позиций в базе предметов</p>
      </article>
      <article className="stat-card">
        <span>Средний профит</span>
        <strong className={getProfitClassName(averageProfit)}>{formatPrice(averageProfit)}</strong>
        <p>Среднее по всем предметам</p>
      </article>
      <article className="stat-card">
        <span>Лучший предмет</span>
        <strong>{bestItem?.name ?? 'Нет данных'}</strong>
        <p className={bestItem ? getProfitClassName(bestItem.profit) : 'profit-neutral'}>
          {bestItem ? `${formatPrice(bestItem.profit)} серебра` : 'Добавьте предмет'}
        </p>
      </article>
      <article className="stat-card">
        <span>Обновлено</span>
        <strong>{formatDateTime(latestUpdatedAt)}</strong>
        <p>Последнее изменение данных</p>
      </article>
    </section>
  );
};