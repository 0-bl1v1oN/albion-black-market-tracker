import type { ItemFormValues, MarketItem } from '../types/market';

type MarketAction = 'list' | 'create' | 'update' | 'delete';

type ApiResponse = {
  ok: boolean;
  items?: MarketItem[];
  item?: MarketItem;
  error?: string;
};

type UpdateItemPayload = ItemFormValues & {
  id: string;
};

const getAppsScriptUrl = (): string => import.meta.env.VITE_APPS_SCRIPT_URL?.trim() ?? '';
const getSecretKey = (): string => import.meta.env.VITE_SECRET_KEY?.trim() ?? '';

const requestMarketApi = async <T>(action: MarketAction, payload: unknown = {}): Promise<T> => {
  const apiUrl = getAppsScriptUrl();
  const secret = getSecretKey();

  if (!apiUrl) {
    throw new Error('Не задан VITE_APPS_SCRIPT_URL. Добавьте URL Google Apps Script Web App в .env.');
  }

  if (!secret) {
    throw new Error('Не задан VITE_SECRET_KEY. Добавьте секретный ключ в .env.');
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      secret,
      action,
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ошибка HTTP ${response.status}: не удалось выполнить запрос к Google Apps Script.`);
  }

  const data = (await response.json()) as ApiResponse;

  if (!data.ok) {
    throw new Error(data.error || 'Google Apps Script вернул ошибку без описания.');
  }

  return data as T;
};

export const listItems = async (): Promise<MarketItem[]> => {
  const data = await requestMarketApi<ApiResponse>('list');
  return data.items ?? [];
};

export const createItem = async (item: ItemFormValues): Promise<MarketItem> => {
  const data = await requestMarketApi<ApiResponse>('create', item);

  if (!data.item) {
    throw new Error('Google Apps Script не вернул созданный предмет.');
  }

  return data.item;
};

export const updateItem = async (item: UpdateItemPayload): Promise<MarketItem> => {
  const data = await requestMarketApi<ApiResponse>('update', item);

  if (!data.item) {
    throw new Error('Google Apps Script не вернул обновленный предмет.');
  }

  return data.item;
};

export const deleteItem = async (id: string): Promise<void> => {
  await requestMarketApi<ApiResponse>('delete', { id });
};