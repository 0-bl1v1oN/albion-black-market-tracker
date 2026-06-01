import { mockItems } from '../data/mockItems';
import type { MarketItem } from '../types/market';

const STORAGE_KEY = 'albion-black-market-items';
const ITEMS_CACHE_KEY = 'albion-market-items-cache';

export type CachedMarketItems = {
  items: MarketItem[];
  cachedAt: string;
};

const isCachedMarketItems = (value: unknown): value is CachedMarketItems => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const cachedItems = value as Partial<CachedMarketItems>;

  return Array.isArray(cachedItems.items) && typeof cachedItems.cachedAt === 'string';
};

export const loadCachedItems = (): CachedMarketItems | null => {
  try {
    const cachedItems = localStorage.getItem(ITEMS_CACHE_KEY);

    if (!cachedItems) {
      return null;
    }

    const parsedItems = JSON.parse(cachedItems) as unknown;

    if (!isCachedMarketItems(parsedItems)) {
      return null;
    }

    return parsedItems;
  } catch {
    return null;
  }
};

export const saveCachedItems = (items: MarketItem[]): CachedMarketItems | null => {
  const cachedItems = {
    items,
    cachedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(ITEMS_CACHE_KEY, JSON.stringify(cachedItems));
    return cachedItems;
  } catch {
    return null;
  }
};

export const clearCachedItems = (): void => {
  try {
    localStorage.removeItem(ITEMS_CACHE_KEY);
  } catch {
    // Ignore unavailable localStorage so the app can continue to use Google as the source of truth.
  }
};

export const loadItems = (): MarketItem[] => {
  const storedItems = localStorage.getItem(STORAGE_KEY);

  if (!storedItems) {
    return mockItems;
  }

  try {
    return JSON.parse(storedItems) as MarketItem[];
  } catch {
    return mockItems;
  }
};

export const saveItems = (items: MarketItem[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};