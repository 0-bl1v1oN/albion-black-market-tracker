import { mockItems } from '../data/mockItems';
import type { MarketItem } from '../types/market';

const STORAGE_KEY = 'albion-black-market-items';

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

export const resetItems = (): MarketItem[] => {
  saveItems(mockItems);
  return mockItems;
};