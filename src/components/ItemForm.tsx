import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ItemCategory, ItemEnchant, ItemFormValues, ItemTier, MarketItem } from '../types/market';
import { calculateProfit, calculateRoi } from '../utils/calculations';
import { formatPrice, formatRoi, getProfitClassName } from '../utils/format';
import { itemCategories } from './Controls';

const initialFormValues: ItemFormValues = {
  name: '',
  tier: 6,
  enchant: 0,
  buyPrice: 0,
  sellPrice: 0,
  category: 'Оружие',
  updatedBy: '',
  comment: '',
};

interface ItemFormProps {
  selectedItem: MarketItem | null;
  onSave: (values: ItemFormValues) => void;
  onClearSelection: () => void;
}

export const ItemForm = ({ selectedItem, onSave, onClearSelection }: ItemFormProps) => {
  const [formValues, setFormValues] = useState<ItemFormValues>(initialFormValues);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedItem) {
      setFormValues({
        name: selectedItem.name,
        tier: selectedItem.tier,
        enchant: selectedItem.enchant,
        buyPrice: selectedItem.buyPrice,
        sellPrice: selectedItem.sellPrice,
        category: selectedItem.category,
        updatedBy: selectedItem.updatedBy,
        comment: selectedItem.comment,
      });
      setError('');
    }
  }, [selectedItem]);

  const preview = useMemo(() => {
    const profit = calculateProfit(formValues.buyPrice, formValues.sellPrice);
    const roi = calculateRoi(formValues.buyPrice, formValues.sellPrice);

    return { profit, roi };
  }, [formValues.buyPrice, formValues.sellPrice]);

  const updateField = <T extends keyof ItemFormValues>(field: T, value: ItemFormValues[T]) => {
    setFormValues((currentValues) => ({ ...currentValues, [field]: value }));
  };

  const validate = (): string => {
    if (!formValues.name.trim()) {
      return 'Название обязательно.';
    }

    if (![6, 7, 8].includes(formValues.tier)) {
      return 'Тир должен быть 6, 7 или 8.';
    }

    if (![0, 1, 2, 3, 4].includes(formValues.enchant)) {
      return 'Зачар должен быть от 0 до 4.';
    }

    if (formValues.buyPrice < 0) {
      return 'Цена покупки не может быть отрицательной.';
    }

    if (formValues.sellPrice < 0) {
      return 'Цена продажи не может быть отрицательной.';
    }

    if (!formValues.category) {
      return 'Категория обязательна.';
    }

    if (!formValues.updatedBy.trim()) {
      return 'Поле «Кто обновил» обязательно.';
    }

    return '';
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onSave({
      ...formValues,
      name: formValues.name.trim(),
      updatedBy: formValues.updatedBy.trim(),
      comment: formValues.comment.trim(),
    });

    if (!selectedItem) {
      setFormValues(initialFormValues);
    }
  };

  const handleClear = () => {
    setFormValues(initialFormValues);
    setError('');
    onClearSelection();
  };

  return (
    <aside className="form-card" aria-label="Форма предмета">
      <div className="form-heading">
        <p className="eyebrow">Запись рынка</p>
        <h2>{selectedItem ? 'Редактировать предмет' : 'Добавить предмет'}</h2>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Название</span>
          <input value={formValues.name} onChange={(event) => updateField('name', event.target.value)} placeholder="Название предмета" />
        </label>

        <div className="form-row">
          <label className="field">
            <span>Тир</span>
            <select value={formValues.tier} onChange={(event) => updateField('tier', Number(event.target.value) as ItemTier)}>
              <option value={6}>T6</option>
              <option value={7}>T7</option>
              <option value={8}>T8</option>
            </select>
          </label>
          <label className="field">
            <span>Зачар</span>
            <select value={formValues.enchant} onChange={(event) => updateField('enchant', Number(event.target.value) as ItemEnchant)}>
              <option value={0}>0</option>
              <option value={1}>.1</option>
              <option value={2}>.2</option>
              <option value={3}>.3</option>
              <option value={4}>.4</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Цена покупки</span>
            <input
              type="number"
              min="0"
              value={formValues.buyPrice}
              onChange={(event) => updateField('buyPrice', Number(event.target.value))}
            />
          </label>
          <label className="field">
            <span>Цена продажи</span>
            <input
              type="number"
              min="0"
              value={formValues.sellPrice}
              onChange={(event) => updateField('sellPrice', Number(event.target.value))}
            />
          </label>
        </div>

        <label className="field">
          <span>Категория</span>
          <select value={formValues.category} onChange={(event) => updateField('category', event.target.value as ItemCategory)}>
            {itemCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Кто обновил</span>
          <input value={formValues.updatedBy} onChange={(event) => updateField('updatedBy', event.target.value)} placeholder="Макс" />
        </label>

        <label className="field">
          <span>Комментарий</span>
          <textarea value={formValues.comment} onChange={(event) => updateField('comment', event.target.value)} rows={4} placeholder="Заметки по закупке" />
        </label>

        <div className="preview-card">
          <span>Предпросмотр</span>
          <div>
            <p>Профит</p>
            <strong className={getProfitClassName(preview.profit)}>{formatPrice(preview.profit)}</strong>
          </div>
          <div>
            <p>ROI</p>
            <strong className={getProfitClassName(preview.profit)}>{formatRoi(preview.roi)}</strong>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button className="button button-primary" type="submit">
            Сохранить
          </button>
          <button className="button button-secondary" type="button" onClick={handleClear}>
            Очистить
          </button>
        </div>
      </form>
    </aside>
  );
};