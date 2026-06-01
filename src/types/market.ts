export type ItemTier = 6 | 7 | 8;
export type ItemEnchant = 0 | 1 | 2 | 3 | 4;

export type ItemCategory = 'Оружие' | 'Броня' | 'Шлем' | 'Обувь' | 'Сумка' | 'Другое';

export interface MarketItem {
  id: string;
  name: string;
  category: ItemCategory;
  tier: ItemTier;
  enchant: ItemEnchant;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  roi: number;
  updatedBy: string;
  updatedAt: string;
  comment: string;
}

export type TierFilter = 'Все' | ItemTier;
export type CategoryFilter = 'Все' | ItemCategory;

export type SortOption =
  | 'profitDesc'
  | 'roiDesc'
  | 'buyPriceAsc'
  | 'sellPriceDesc'
  | 'updatedAtDesc';

export interface ItemFormValues {
  name: string;
  tier: ItemTier;
  enchant: ItemEnchant;
  buyPrice: number;
  sellPrice: number;
  category: ItemCategory;
  updatedBy: string;
  comment: string;
}