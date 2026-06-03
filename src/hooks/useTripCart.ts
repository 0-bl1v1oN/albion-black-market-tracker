import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MarketItem } from '../types/market';
import type { TripCartItem } from '../types/run';
import { calculateProfit, calculateRoi } from '../utils/calculations';

const TRIP_CART_STORAGE_KEY = 'albion-trip-cart';

const sanitizeNumber = (value: number, fallback = 0): number => (Number.isFinite(value) ? Math.max(0, value) : fallback);

const loadStoredCart = (): TripCartItem[] => {
  try {
    const storedCart = localStorage.getItem(TRIP_CART_STORAGE_KEY);

    if (!storedCart) {
      return [];
    }

    const parsedCart = JSON.parse(storedCart) as unknown;

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    return parsedCart.filter((item): item is TripCartItem => {
      const candidate = item as Partial<TripCartItem>;
      return typeof candidate.cartId === 'string' && typeof candidate.itemId === 'string' && typeof candidate.name === 'string';
    });
  } catch {
    return [];
  }
};

export const useTripCart = () => {
  const [cartItems, setCartItems] = useState<TripCartItem[]>(() => loadStoredCart());

  useEffect(() => {
    try {
      if (cartItems.length === 0) {
        localStorage.removeItem(TRIP_CART_STORAGE_KEY);
        return;
      }

      localStorage.setItem(TRIP_CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore unavailable localStorage. The cart remains in state for the current session.
    }
  }, [cartItems]);

  const addItem = useCallback((item: MarketItem) => {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((cartItem) => cartItem.itemId === item.id);

      if (existingItem) {
        return currentItems.map((cartItem) =>
          cartItem.cartId === existingItem.cartId ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        );
      }

      return [
        ...currentItems,
        {
          cartId: crypto.randomUUID(),
          itemId: item.id,
          name: item.name,
          category: item.category,
          tier: item.tier,
          enchant: item.enchant,
          quantity: 1,
          buyPrice: item.buyPrice,
          sellPrice: item.sellPrice,
        },
      ];
    });
  }, []);

  const updateItem = useCallback((cartId: string, values: Partial<Pick<TripCartItem, 'quantity' | 'buyPrice' | 'sellPrice'>>) => {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.cartId === cartId
          ? {
              ...item,
              quantity: values.quantity === undefined ? item.quantity : Math.max(1, Math.floor(sanitizeNumber(values.quantity, item.quantity))),
              buyPrice: values.buyPrice === undefined ? item.buyPrice : sanitizeNumber(values.buyPrice, item.buyPrice),
              sellPrice: values.sellPrice === undefined ? item.sellPrice : sanitizeNumber(values.sellPrice, item.sellPrice),
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setCartItems((currentItems) => currentItems.filter((item) => item.cartId !== cartId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    try {
      localStorage.removeItem(TRIP_CART_STORAGE_KEY);
    } catch {
      // Ignore unavailable localStorage.
    }
  }, []);

  const totals = useMemo(() => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalBuy = cartItems.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0);
    const totalSell = cartItems.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
    const totalProfit = totalSell - totalBuy;
    const roi = calculateRoi(totalBuy, totalSell);

    return {
      totalItems,
      totalBuy,
      totalSell,
      totalProfit,
      roi,
    };
  }, [cartItems]);

  return {
    cartItems,
    totals,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    getItemProfit: (item: TripCartItem) => calculateProfit(item.buyPrice, item.sellPrice),
  };
};
