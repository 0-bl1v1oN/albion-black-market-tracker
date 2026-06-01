import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as marketApi from '../api/marketApi';
import type { ItemFormValues, MarketItem } from '../types/market';
import { calculateProfit, calculateRoi } from '../utils/calculations';
import {
  loadCachedItems,
  loadItems as loadLocalItems,
  saveCachedItems,
  saveItems as saveLocalItems,
} from '../utils/storage';

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
  const initialCachedItems = useMemo(() => (isRemoteConfigured ? loadCachedItems() : null), [isRemoteConfigured]);
  const initialItems = useMemo(
    () => (isRemoteConfigured ? initialCachedItems?.items ?? [] : loadLocalItems()),
    [initialCachedItems, isRemoteConfigured],
  );
  const [items, setItems] = useState<MarketItem[]>(initialItems);
  const itemsRef = useRef(initialItems);
  const [initialLoading, setInitialLoading] = useState(isRemoteConfigured && !initialCachedItems);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasCompletedInitialLoad = useRef(!isRemoteConfigured || Boolean(initialCachedItems));
  const [error, setError] = useState<string | null>(
    isRemoteConfigured ? null : 'VITE_APPS_SCRIPT_URL не задан. Сейчас используется локальный fallback на моковых данных.',
  );
  const [isUsingCache, setIsUsingCacheState] = useState(Boolean(initialCachedItems));
  const isUsingCacheRef = useRef(Boolean(initialCachedItems));
  const [cacheUpdatedAt, setCacheUpdatedAt] = useState<string | undefined>(initialCachedItems?.cachedAt);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true);

  const replaceItems = useCallback((nextItems: MarketItem[]) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
  }, []);

  const setCacheUsage = useCallback((nextValue: boolean) => {
    isUsingCacheRef.current = nextValue;
    setIsUsingCacheState(nextValue);
  }, []);

  const persistCachedItems = useCallback((nextItems: MarketItem[]) => {
    const cachedItems = saveCachedItems(nextItems);

    if (cachedItems) {
      setCacheUpdatedAt(cachedItems.cachedAt);
    }
  }, []);
  
  const loadItems = useCallback(
    async ({ silent = false }: LoadItemsOptions = {}) => {
      if (!isRemoteConfigured) {
        const localItems = loadLocalItems();
        replaceItems(localItems);
        setError('VITE_APPS_SCRIPT_URL не задан. Сейчас используется локальный fallback на моковых данных.');
        setInitialLoading(false);
        setIsRefreshing(false);
        hasCompletedInitialLoad.current = true;
        setCacheUsage(false);
        return localItems;
      }

    const isInitialRequest = !hasCompletedInitialLoad.current;
    const shouldShowRefreshing = !isInitialRequest && (!silent || isUsingCacheRef.current);

      if (isInitialRequest) {
        setInitialLoading(true);
      } else if (shouldShowRefreshing) {
        setIsRefreshing(true);
      }

      try {
        const loadedItems = await marketApi.listItems();
        replaceItems(loadedItems);
        persistCachedItems(loadedItems);
        setCacheUsage(false);
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
        } else if (shouldShowRefreshing) {
          setIsRefreshing(false);
        }
      }
    },
    [isRemoteConfigured, persistCachedItems, replaceItems, setCacheUsage],
  );

  const createItem = useCallback(
    async (values: ItemFormValues) => {
      if (!isRemoteConfigured) {
        const createdItem = createLocalItemFromForm(values);
        const nextItems = [createdItem, ...itemsRef.current];
        replaceItems(nextItems);
        saveLocalItems(nextItems);
        void loadItems({ silent: true }).catch(() => undefined);
        return createdItem;
      }

      try {
        const apiItem = await marketApi.createItem(values);
        const createdItem = apiItem ?? createLocalItemFromForm(values);
        const nextItems = [createdItem, ...itemsRef.current];
        replaceItems(nextItems);
        persistCachedItems(nextItems);
        setCacheUsage(false);
        setError(null);
        void loadItems({ silent: true }).catch(() => undefined);
        return createdItem;
      } catch (createError) {
        const message = createError instanceof Error ? createError.message : 'Не удалось добавить предмет.';
        setError(message);
        throw createError;
      }
    },
    [isRemoteConfigured, loadItems, persistCachedItems, replaceItems, setCacheUsage],
  );

  const updateItem = useCallback(
    async (id: string, values: ItemFormValues) => {
      if (!isRemoteConfigured) {
        const updatedItem = createLocalItemFromForm(values, id);
        const nextItems = itemsRef.current.map((item) => (item.id === id ? updatedItem : item));
        replaceItems(nextItems);
        saveLocalItems(nextItems);
        void loadItems({ silent: true }).catch(() => undefined);
        return updatedItem;
      }

      try {
        const apiItem = await marketApi.updateItem({ ...values, id });
        const updatedItem = apiItem ?? createLocalItemFromForm(values, id);
        const nextItems = itemsRef.current.map((item) => (item.id === id ? updatedItem : item));
        replaceItems(nextItems);
        persistCachedItems(nextItems);
        setCacheUsage(false);
        setError(null);
        void loadItems({ silent: true }).catch(() => undefined);
        return updatedItem;
      } catch (updateError) {
        const message = updateError instanceof Error ? updateError.message : 'Не удалось обновить предмет.';
        setError(message);
        throw updateError;
      }
    },
    [isRemoteConfigured, loadItems, persistCachedItems, replaceItems, setCacheUsage],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!isRemoteConfigured) {
        const nextItems = itemsRef.current.filter((item) => item.id !== id);
        replaceItems(nextItems);
        saveLocalItems(nextItems);
        void loadItems({ silent: true }).catch(() => undefined);
        return;
      }

      try {
        await marketApi.deleteItem(id);
        const nextItems = itemsRef.current.filter((item) => item.id !== id);
        replaceItems(nextItems);
        persistCachedItems(nextItems);
        setCacheUsage(false);
        setError(null);
        void loadItems({ silent: true }).catch(() => undefined);
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : 'Не удалось удалить предмет.';
        setError(message);
        throw deleteError;
      }
    },
    [isRemoteConfigured, loadItems, persistCachedItems, replaceItems, setCacheUsage],
  );

  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((currentValue) => !currentValue);
  }, []);

  useEffect(() => {
    void loadItems({ silent: Boolean(initialCachedItems) }).catch(() => undefined);
  }, [initialCachedItems, loadItems]);

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
    isUsingCache,
    cacheUpdatedAt,
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