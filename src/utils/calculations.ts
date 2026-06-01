import type { MarketItem } from '../types/market';

export const calculateProfit = (buyPrice: number, sellPrice: number): number => sellPrice - buyPrice;

export const calculateRoi = (buyPrice: number, sellPrice: number): number => {
  if (buyPrice === 0) {
    return 0;
  }

  return (calculateProfit(buyPrice, sellPrice) / buyPrice) * 100;
};

export const getAverageProfit = (items: MarketItem[]): number => {
  if (items.length === 0) {
    return 0;
  }

  return items.reduce((sum, item) => sum + item.profit, 0) / items.length;
};

export const getBestItem = (items: MarketItem[]): MarketItem | null => {
  if (items.length === 0) {
    return null;
  }

  return items.reduce((best, item) => (item.profit > best.profit ? item : best), items[0]);
};

export const getLatestUpdatedAt = (items: MarketItem[]): string => {
  if (items.length === 0) {
    return 'Нет данных';
  }

  return items.reduce((latest, item) => {
    return new Date(item.updatedAt).getTime() > new Date(latest).getTime() ? item.updatedAt : latest;
  }, items[0].updatedAt);
};