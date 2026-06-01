import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as marketApi from '../api/marketApi';
import type { ItemFormValues, MarketItem } from '../types/market';
import { calculateProfit, calculateRoi } from '../utils/calculations';
import { loadItems as loadLocalItems, saveItems as saveLocalItems } from '../utils/storage';

const DEFAULT_POLLING_INTERVAL_MS = 15000;

type LoadItemsOptions = {
  silent?: boolean;
};

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
  const [initialLoading, setInitialLoading] = useState(isRemoteConfigured);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasCompletedInitialLoad = useRef(!isRemoteConfigured);
  const [error, setError] = useState<string | null>(
    isRemoteConfigured ? null : 'VITE_APPS_SCRIPT_URL не задан. Сейчас используется локальный fallback на моковых данных.',
  );
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  const loadItems = useCallback(
    async ({ silent = false }: LoadItemsOptions = {}) => {
      if (!isRemoteConfigured) {
        const localItems = loadLocalItems();
        setItems(localItems);
        setError('VITE_APPS_SCRIPT_URL не задан. Сейчас используется локальный fallback на моковых данных.');
        setInitialLoading(false);
        setIsRefreshing(false);
        hasCompletedInitialLoad.current = true;
        return localItems;
      }

    const isInitialRequest = !hasCompletedInitialLoad.current;

      if (isInitialRequest) {
        setInitialLoading(true);
      } else if (!silent) {
        setIsRefreshing(true);
      }

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
        if (isInitialRequest) {
          hasCompletedInitialLoad.current = true;
          setInitialLoading(false);
        } else if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [isRemoteConfigured],
  );

  const createItem = useCallback(
    async (values: ItemFormValues) => {
      if (!isRemoteConfigured) {
        const createdItem = createLocalItemFromForm(values);
        setItems((currentItems) => {
          const nextItems = [createdItem, ...currentItems];
          saveLocalItems(nextItems);
          return nextItems;
        });
        void loadItems({ silent: true }).catch(() => undefined);
        return createdItem;
      }

      try {
        const apiItem = await marketApi.createItem(values);
        const createdItem = apiItem ?? createLocalItemFromForm(values);
        setItems((currentItems) => [createdItem, ...currentItems]);
        setError(null);
        void loadItems({ silent: true }).catch(() => undefined);
        return createdItem;
      } catch (createError) {
        const message = createError instanceof Error ? createError.message : 'Не удалось добавить предмет.';
        setError(message);
        throw createError;
      }
    },
    [isRemoteConfigured, loadItems],
  );

  const updateItem = useCallback(
    async (id: string, values: ItemFormValues) => {
      if (!isRemoteConfigured) {
        const updatedItem = createLocalItemFromForm(values, id);
        setItems((currentItems) => {
          const nextItems = currentItems.map((item) => (item.id === id ? updatedItem : item));
          saveLocalItems(nextItems);
          return nextItems;
        });
        void loadItems({ silent: true }).catch(() => undefined);
        return updatedItem;
      }

      try {
        const apiItem = await marketApi.updateItem({ ...values, id });
        const updatedItem = apiItem ?? createLocalItemFromForm(values, id);
        setItems((currentItems) => currentItems.map((item) => (item.id === id ? updatedItem : item)));
        setError(null);
        void loadItems({ silent: true }).catch(() => undefined);
        return updatedItem;
      } catch (updateError) {
        const message = updateError instanceof Error ? updateError.message : 'Не удалось обновить предмет.';
        setError(message);
        throw updateError;
      }
    },
    [isRemoteConfigured, loadItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!isRemoteConfigured) {
        setItems((currentItems) => {
          const nextItems = currentItems.filter((item) => item.id !== id);
          saveLocalItems(nextItems);
          return nextItems;
        });
        void loadItems({ silent: true }).catch(() => undefined);
        return;
      }

      try {
        await marketApi.deleteItem(id);
        setItems((currentItems) => currentItems.filter((item) => item.id !== id));
        setError(null);
        void loadItems({ silent: true }).catch(() => undefined);
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : 'Не удалось удалить предмет.';
        setError(message);
        throw deleteError;
      }
    },
    [isRemoteConfigured, loadItems],
  );

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    void loadItems({ silent: false }).catch(() => undefined);
  }, [loadItems]);

  useEffect(() => {
    if (!isRemoteConfigured || !isAutoRefreshEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadItems({ silent: false }).catch(() => undefined);
    }, getPollingInterval());

    return () => window.clearInterval(intervalId);
  }, [isAutoRefreshEnabled, isRemoteConfigured, loadItems]);

  return {
    items,
    loading: initialLoading || isRefreshing,
    initialLoading,
    isRefreshing,
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