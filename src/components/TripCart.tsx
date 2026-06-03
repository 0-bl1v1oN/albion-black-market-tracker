import type { ChangeEvent, FormEvent } from 'react';
import type { TripCartItem } from '../types/run';
import { calculateProfit } from '../utils/calculations';
import { formatPrice, formatRoi, getProfitClassName } from '../utils/format';

interface TripCartProps {
  cartItems: TripCartItem[];
  totals: {
    totalItems: number;
    totalBuy: number;
    totalSell: number;
    totalProfit: number;
    roi: number;
  };
  createdBy: string;
  comment: string;
  isSaving: boolean;
  onCreatedByChange: (value: string) => void;
  onCommentChange: (value: string) => void;
  onUpdateItem: (cartId: string, values: Partial<Pick<TripCartItem, 'quantity' | 'buyPrice' | 'sellPrice'>>) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onCompleteRun: () => void;
}

const getNumericValue = (event: ChangeEvent<HTMLInputElement>) => Number(event.target.value) || 0;

export const TripCart = ({
  cartItems,
  totals,
  createdBy,
  comment,
  isSaving,
  onCreatedByChange,
  onCommentChange,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onCompleteRun,
}: TripCartProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onCompleteRun();
  };

  return (
    <section className="table-card trip-cart-card" aria-label="Корзина текущей ходки">
      <div className="table-heading">
        <div>
          <h2>Корзина ходки</h2>
          <p>Данные сохраняются локально и отправляются только при завершении ходки</p>
        </div>
        <span>{totals.totalItems} шт.</span>
      </div>

      <form className="trip-meta-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Кто сделал ходку</span>
          <input value={createdBy} onChange={(event) => onCreatedByChange(event.target.value)} placeholder="Максим" />
        </label>
        <label className="field">
          <span>Комментарий</span>
          <input value={comment} onChange={(event) => onCommentChange(event.target.value)} placeholder="Вечерняя ходка" />
        </label>
      </form>

      <div className="trip-totals">
        <div className="stat-card compact-stat">
          <span>Общий закуп</span>
          <strong>{formatPrice(totals.totalBuy)}</strong>
        </div>
        <div className="stat-card compact-stat">
          <span>Общая продажа</span>
          <strong>{formatPrice(totals.totalSell)}</strong>
        </div>
        <div className="stat-card compact-stat">
          <span>Общий профит</span>
          <strong className={getProfitClassName(totals.totalProfit)}>{formatPrice(totals.totalProfit)}</strong>
        </div>
        <div className="stat-card compact-stat">
          <span>ROI ходки</span>
          <strong className={getProfitClassName(totals.roi)}>{formatRoi(totals.roi)}</strong>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Кол-во</th>
              <th>Закуп за шт.</th>
              <th>Продажа за шт.</th>
              <th>Профит за шт.</th>
              <th>Итоговый профит</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {cartItems.length === 0 ? (
              <tr>
                <td className="empty-table" colSpan={7}>
                  Корзина пуста. Добавьте предметы из базы слева или выше.
                </td>
              </tr>
            ) : (
              cartItems.map((item) => {
                const profitPerItem = calculateProfit(item.buyPrice, item.sellPrice);
                const totalProfit = profitPerItem * item.quantity;

                return (
                  <tr key={item.cartId}>
                    <td className="item-name-cell">
                      <strong>{item.name}</strong>
                      <small>
                        T{item.tier} {item.enchant === 0 ? '0' : `.${item.enchant}`} · {item.category}
                      </small>
                    </td>
                    <td>
                      <input
                        className="compact-input"
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(event) => onUpdateItem(item.cartId, { quantity: getNumericValue(event) })}
                      />
                    </td>
                    <td>
                      <input
                        className="compact-input"
                        type="number"
                        min="0"
                        step="1"
                        value={item.buyPrice}
                        onChange={(event) => onUpdateItem(item.cartId, { buyPrice: getNumericValue(event) })}
                      />
                    </td>
                    <td>
                      <input
                        className="compact-input"
                        type="number"
                        min="0"
                        step="1"
                        value={item.sellPrice}
                        onChange={(event) => onUpdateItem(item.cartId, { sellPrice: getNumericValue(event) })}
                      />
                    </td>
                    <td className={getProfitClassName(profitPerItem)}>{formatPrice(profitPerItem)}</td>
                    <td className={getProfitClassName(totalProfit)}>{formatPrice(totalProfit)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => onRemoveItem(item.cartId)}>
                          Убрать
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="cart-actions">
        <button className="button button-secondary" type="button" onClick={onClearCart} disabled={cartItems.length === 0 || isSaving}>
          Очистить корзину
        </button>
        <button className="button button-primary" type="button" onClick={onCompleteRun} disabled={cartItems.length === 0 || isSaving}>
          {isSaving ? 'Сохраняем...' : 'Завершить ходку'}
        </button>
      </div>
    </section>
  );
};
