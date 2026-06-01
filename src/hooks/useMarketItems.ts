import { useCallback, useEffect, useMemo, useState } from 'react';
import * as marketApi from '../api/marketApi';
import type { ItemFormValues, MarketItem } from '../types/market';
import { calculateProfit, calculateRoi } from '../utils/calculations';
import { loadItems as loadLocalItems, saveItems as saveLocalItems } from '../utils/storage';

const DEFAULT_POLLING_INTERVAL_MS = 5000;

const getPollingInterval = (): number => {
  const parsedInterval = Number(import.meta.env.VITE_POLLING_INTERVAL_MS);
  return Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : DEFAULT_POLLING_INTERVAL_MS;
};

const createLocalItemFromForm = (values: ItemFormValues, id: string = crypto.randomUUID()): MarketItem => {
  const profit = calculateProfit(values.buyPrice, values.sellPrice);
  const roi = calculateRoi(values.buyPrice, values.sellPrice);

  return {
    ...values,
    id,
    profit,
    roi,
    updatedAt: new Date().toISOString(),
  };
};

export const useMarketItems = () => {
  const isRemoteConfigured = useMemo(() => Boolean(import.meta.env.VITE_APPS_SCRIPT_URL?.trim()), []);
  const [items, setItems] = useState<MarketItem[]>(() => (isRemoteConfigured ? [] : loadLocalItems()));
  const [loading, setLoading] = useState(isRemoteConfigured);
  const [error, setError] = useState<string | null>(
    isRemoteConfigured ? null : 'VITE_APPS_SCRIPT_URL не задан. Сейчас используется локальный fallback на моковых данных.',
  );
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  const loadItems = useCallback(async () => {
    if (!isRemoteConfigured) {
      const localItems = loadLocalItems();
      setItems(localItems);
      setError('VITE_APPS_SCRIPT_URL не задан. Сейчас используется локальный fallback на моковых данных.');
      setLoading(false);
      return localItems;
    }

    setLoading(true);

    try {
      const loadedItems = await marketApi.listItems();
      setItems(loadedItems);
      setError(null);
      return loadedItems;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Не удалось загрузить данные из Google Таблицы.';
      setError(message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, [isRemoteConfigured]);

  const createItem = useCallback(
    async (values: ItemFormValues) => {
      if (!isRemoteConfigured) {
        const createdItem = createLocalItemFromForm(values);
        const nextItems = [createdItem, ...items];
        setItems(nextItems);
        saveLocalItems(nextItems);
        await loadItems();
        return createdItem;
      }

      try {
        const createdItem = await marketApi.createItem(values);
        await loadItems();
        return createdItem;
      } catch (createError) {
        const message = createError instanceof Error ? createError.message : 'Не удалось добавить предмет.';
        setError(message);
        throw createError;
      }
    },
    [isRemoteConfigured, items, loadItems],
  );

  const updateItem = useCallback(
    async (id: string, values: ItemFormValues) => {
      if (!isRemoteConfigured) {
        const nextItems = items.map((item) => (item.id === id ? createLocalItemFromForm(values, id) : item));
        const updatedItem = nextItems.find((item) => item.id === id);
        setItems(nextItems);
        saveLocalItems(nextItems);
        await loadItems();
        return updatedItem ?? null;
      }

      try {
        const updatedItem = await marketApi.updateItem({ ...values, id });
        await loadItems();
        return updatedItem;
      } catch (updateError) {
        const message = updateError instanceof Error ? updateError.message : 'Не удалось обновить предмет.';
        setError(message);
        throw updateError;
      }
    },
    [isRemoteConfigured, items, loadItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!isRemoteConfigured) {
        const nextItems = items.filter((item) => item.id !== id);
        setItems(nextItems);
        saveLocalItems(nextItems);
        await loadItems();
        return;
      }

      try {
        await marketApi.deleteItem(id);
        await loadItems();
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : 'Не удалось удалить предмет.';
        setError(message);
        throw deleteError;
      }
    },
    [isRemoteConfigured, items, loadItems],
  );

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    void loadItems().catch(() => undefined);
  }, [loadItems]);

  useEffect(() => {
    if (!isRemoteConfigured || !isAutoRefreshEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadItems().catch(() => undefined);
    }, getPollingInterval());

    return () => window.clearInterval(intervalId);
  }, [isAutoRefreshEnabled, isRemoteConfigured, loadItems]);

  return {
    items,
    loading,
    error,
    isAutoRefreshEnabled,
    isRemoteConfigured,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    setIsAutoRefreshEnabled,
    toggleAutoRefresh,
  };
};