import type { ItemCategory, ItemEnchant, ItemTier } from './market';

export interface TripCartItem {
  cartId: string;
  itemId: string;
  name: string;
  category: ItemCategory;
  tier: ItemTier;
  enchant: ItemEnchant;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
}

export interface RunItem {
  id: string;
  runId: string;
  itemId: string;
  name: string;
  category: ItemCategory;
  tier: ItemTier;
  enchant: ItemEnchant;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profitPerItem: number;
  totalBuy: number;
  totalSell: number;
  totalProfit: number;
}

export interface Run {
  id: string;
  createdAt: string;
  createdBy: string;
  totalItems: number;
  totalBuy: number;
  totalSell: number;
  totalProfit: number;
  roi: number;
  comment: string;
}

export interface RunDetails {
  run: Run;
  items: RunItem[];
}

export interface CreateRunPayload {
  createdBy: string;
  comment: string;
  items: TripCartItem[];
}

export type RunSortOption = 'dateDesc' | 'dateAsc' | 'profitDesc' | 'roiDesc';
