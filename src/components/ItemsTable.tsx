import type { MarketItem } from '../types/market';
import { formatDateTime, formatPrice, formatRoi, getProfitClassName } from '../utils/format';

interface ItemsTableProps {
  items: MarketItem[];
  totalItems: number;
  initialLoading: boolean;
  hasError: boolean;
  onEdit: (item: MarketItem) => void;
  onDelete: (itemId: string) => void;
}

export const ItemsTable = ({ items, totalItems, initialLoading, hasError, onEdit, onDelete }: ItemsTableProps) => {
  const getEmptyMessage = () => {
    if (initialLoading) {
      return 'Загружаем базу...';
    }

    if (hasError && totalItems === 0) {
      return 'Не удалось загрузить данные. Проверьте статус синхронизации и попробуйте обновить еще раз.';
    }

    if (totalItems === 0) {
      return 'Нет данных. Добавьте новый предмет.';
    }

    return 'Ничего не найдено. Измените фильтры или добавьте новый предмет.';
  };
  return (
    <section className="table-card" aria-label="Таблица предметов">
      <div className="table-heading">
        <div>
          <h2>Предметы</h2>
          <p>База цен и профита</p>
        </div>
        <span>{initialLoading ? 'Загрузка...' : `${items.length} найдено`}</span>
      </div>

      <div className="table-scroll">
        <table>
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
              <th>Обновил</th>
              <th>Время</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="empty-table" colSpan={11}>
                  {getEmptyMessage()}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td className="item-name-cell">
                    <strong>{item.name}</strong>
                    {item.comment && <small>{item.comment}</small>}
                  </td>
                  <td>T{item.tier}</td>
                  <td>{item.enchant === 0 ? '0' : `.${item.enchant}`}</td>
                  <td>{item.category}</td>
                  <td>{formatPrice(item.buyPrice)}</td>
                  <td>{formatPrice(item.sellPrice)}</td>
                  <td className={getProfitClassName(item.profit)}>{formatPrice(item.profit)}</td>
                  <td className={getProfitClassName(item.profit)}>{formatRoi(item.roi)}</td>
                  <td>{item.updatedBy}</td>
                  <td>{formatDateTime(item.updatedAt)}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => onEdit(item)}>
                        Изменить
                      </button>
                      <button type="button" onClick={() => onDelete(item.id)}>
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};