import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
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

type DraftCartInputs = Record<string, { quantity: string; buyPrice: string; sellPrice: string }>;
type NumericField = 'quantity' | 'buyPrice' | 'sellPrice';

const digitsOnlyPattern = /^\d*$/;

const createDraftInputs = (cartItems: TripCartItem[]): DraftCartInputs =>
  cartItems.reduce<DraftCartInputs>((drafts, item) => {
    drafts[item.cartId] = {
      quantity: String(item.quantity),
      buyPrice: String(item.buyPrice),
      sellPrice: String(item.sellPrice),
    };

    return drafts;
  }, {});

const selectInputValue = (event: FocusEvent<HTMLInputElement>) => {
  event.currentTarget.select();
};

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
  const [draftInputs, setDraftInputs] = useState<DraftCartInputs>(() => createDraftInputs(cartItems));

  useEffect(() => {
    setDraftInputs(createDraftInputs(cartItems));
  }, [cartItems]);
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onCompleteRun();
  };

  const handleNumericChange = (cartId: string, field: NumericField, event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;

    if (!digitsOnlyPattern.test(value)) {
      return;
    }

    setDraftInputs((currentDrafts) => ({
      ...currentDrafts,
      [cartId]: {
        ...(currentDrafts[cartId] ?? { quantity: '', buyPrice: '', sellPrice: '' }),
        [field]: value,
      },
    }));

    if (value === '') {
      return;
    }

    const numericValue = Number(value);

    if (field === 'quantity' && numericValue < 1) {
      return;
    }

    onUpdateItem(cartId, { [field]: numericValue });
  };

  const handleNumericBlur = (item: TripCartItem, field: NumericField) => {
    const rawValue = draftInputs[item.cartId]?.[field] ?? '';
    const fallbackValue = field === 'quantity' ? 1 : 0;
    const parsedValue = rawValue === '' ? fallbackValue : Number(rawValue);
    const normalizedValue = field === 'quantity' ? Math.max(1, Math.floor(parsedValue || fallbackValue)) : Math.max(0, Math.floor(parsedValue || 0));

    setDraftInputs((currentDrafts) => ({
      ...currentDrafts,
      [item.cartId]: {
        ...(currentDrafts[item.cartId] ?? { quantity: '', buyPrice: '', sellPrice: '' }),
        [field]: String(normalizedValue),
      },
    }));
    onUpdateItem(item.cartId, { [field]: normalizedValue });
  };

  return (
    <section className="table-card trip-cart-card" aria-label="Корзина текущей ходки">
      <div className="table-heading trip-cart-heading">
        <div>
          <h2>Корзина ходки</h2>
          <p>Добавленные предметы для текущей ходки</p>
        </div>
        <button className="button button-secondary cart-clear-button" type="button" onClick={onClearCart} disabled={cartItems.length === 0 || isSaving}>
          Очистить корзину
        </button>
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

      <div className="table-scroll trip-cart-scroll">
        <table className="trip-cart-table">
          <thead>
            <tr>
              <th>Предмет</th>
              <th>Кол-во</th>
              <th>Закуп</th>
              <th>Продажа</th>
              <th>Профит</th>
              <th>Итог</th>
              <th aria-label="Убрать"></th>
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
                const draft = draftInputs[item.cartId] ?? {
                  quantity: String(item.quantity),
                  buyPrice: String(item.buyPrice),
                  sellPrice: String(item.sellPrice),
                };

                return (
                  <tr key={item.cartId}>
                    <td className="item-name-cell" title={item.name}>
                      <strong>{item.name}</strong>
                      <small>
                        T{item.tier} {item.enchant === 0 ? '0' : `.${item.enchant}`} · {item.category}
                      </small>
                    </td>
                    <td>
                      <input
                        className="compact-input quantity-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={draft.quantity}
                        onFocus={selectInputValue}
                        onChange={(event) => handleNumericChange(item.cartId, 'quantity', event)}
                        onBlur={() => handleNumericBlur(item, 'quantity')}
                      />
                    </td>
                    <td>
                      <input
                        className="compact-input price-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={draft.buyPrice}
                        onFocus={selectInputValue}
                        onChange={(event) => handleNumericChange(item.cartId, 'buyPrice', event)}
                        onBlur={() => handleNumericBlur(item, 'buyPrice')}
                      />
                    </td>
                    <td>
                      <input
                        className="compact-input price-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={draft.sellPrice}
                        onFocus={selectInputValue}
                        onChange={(event) => handleNumericChange(item.cartId, 'sellPrice', event)}
                        onBlur={() => handleNumericBlur(item, 'sellPrice')}
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

      <div className="trip-totals" aria-label="Итоги корзины ходки">
        <div className="stat-card compact-stat">
          <span>Всего предметов</span>
          <strong>{totals.totalItems}</strong>
        </div>
        <div className="stat-card compact-stat">
          <span>Сумма закупа</span>
          <strong>{formatPrice(totals.totalBuy)}</strong>
        </div>
        <div className="stat-card compact-stat">
          <span>Сумма продажи</span>
          <strong>{formatPrice(totals.totalSell)}</strong>
        </div>
        <div className="stat-card compact-stat">
          <span>Профит за ходку</span>
          <strong className={getProfitClassName(totals.totalProfit)}>{formatPrice(totals.totalProfit)}</strong>
        </div>
        <div className="stat-card compact-stat">
          <span>ROI ходки</span>
          <strong className={getProfitClassName(totals.roi)}>{formatRoi(totals.roi)}</strong>
        </div>
      </div>

      <div className="cart-actions">
        <button className="button button-primary cart-complete-button" type="button" onClick={onCompleteRun} disabled={cartItems.length === 0 || isSaving}>
          {isSaving ? 'Сохраняем...' : 'Завершить ходку'}
        </button>
      </div>
    </section>
  );
};
