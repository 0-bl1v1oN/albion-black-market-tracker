import type { RunDetails as RunDetailsType } from '../types/run';
import { formatDateTime, formatPrice, formatRoi, getProfitClassName } from '../utils/format';

interface RunDetailsProps {
  details: RunDetailsType | null;
  isLoading: boolean;
  onClose: () => void;
}

export const RunDetails = ({ details, isLoading, onClose }: RunDetailsProps) => {
  if (!details && !isLoading) {
    return null;
  }

  return (
    <section className="table-card run-details-card" aria-label="Состав ходки">
      <div className="table-heading">
        <div>
          <h2>Состав ходки</h2>
          <p>{details ? `${formatDateTime(details.run.createdAt)} · ${details.run.createdBy}` : 'Загружаем детали...'}</p>
        </div>
        <button className="button button-secondary" type="button" onClick={onClose}>Закрыть</button>
      </div>

      {isLoading && <div className="app-loading details-loading">Загружаем состав ходки...</div>}

      {details && (
        <>
          <div className="trip-totals details-totals">
            <div className="stat-card compact-stat">
              <span>Предметов</span>
              <strong>{details.run.totalItems}</strong>
            </div>
            <div className="stat-card compact-stat">
              <span>Закуп</span>
              <strong>{formatPrice(details.run.totalBuy)}</strong>
            </div>
            <div className="stat-card compact-stat">
              <span>Продажа</span>
              <strong>{formatPrice(details.run.totalSell)}</strong>
            </div>
            <div className="stat-card compact-stat">
              <span>Профит</span>
              <strong className={getProfitClassName(details.run.totalProfit)}>{formatPrice(details.run.totalProfit)}</strong>
            </div>
            <div className="stat-card compact-stat">
              <span>ROI</span>
              <strong className={getProfitClassName(details.run.roi)}>{formatRoi(details.run.roi)}</strong>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Предмет</th>
                  <th>Тир</th>
                  <th>Зачар</th>
                  <th>Категория</th>
                  <th>Кол-во</th>
                  <th>Закуп за шт.</th>
                  <th>Продажа за шт.</th>
                  <th>Профит за шт.</th>
                  <th>Итоговый закуп</th>
                  <th>Итоговая продажа</th>
                  <th>Итоговый профит</th>
                </tr>
              </thead>
              <tbody>
                {details.items.length === 0 ? (
                  <tr>
                    <td className="empty-table" colSpan={11}>В ходке нет предметов.</td>
                  </tr>
                ) : (
                  details.items.map((item) => (
                    <tr key={item.id}>
                      <td className="item-name-cell"><strong>{item.name}</strong></td>
                      <td>T{item.tier}</td>
                      <td>{item.enchant === 0 ? '0' : `.${item.enchant}`}</td>
                      <td>{item.category}</td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(item.buyPrice)}</td>
                      <td>{formatPrice(item.sellPrice)}</td>
                      <td className={getProfitClassName(item.profitPerItem)}>{formatPrice(item.profitPerItem)}</td>
                      <td>{formatPrice(item.totalBuy)}</td>
                      <td>{formatPrice(item.totalSell)}</td>
                      <td className={getProfitClassName(item.totalProfit)}>{formatPrice(item.totalProfit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
