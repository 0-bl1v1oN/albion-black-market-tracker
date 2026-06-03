import { mockItems } from '../data/mockItems';
import type { MarketItem } from '../types/market';
import type { Run, RunDetails } from '../types/run';

const STORAGE_KEY = 'albion-black-market-items';
const ITEMS_CACHE_KEY = 'albion-market-items-cache';
const RUNS_CACHE_KEY = 'albion-runs-cache';
const RUN_DETAILS_CACHE_KEY_PREFIX = 'albion-run-details-cache-';

export type CachedMarketItems = {
  items: MarketItem[];
  cachedAt: string;
};

export type CachedRuns = {
  runs: Run[];
  cachedAt: string;
};

export type CachedRunDetails = {
  details: RunDetails;
  cachedAt: string;
};

const isCachedMarketItems = (value: unknown): value is CachedMarketItems => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const cachedItems = value as Partial<CachedMarketItems>;

  return Array.isArray(cachedItems.items) && typeof cachedItems.cachedAt === 'string';
};

const isCachedRuns = (value: unknown): value is CachedRuns => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const cachedRuns = value as Partial<CachedRuns>;

  return Array.isArray(cachedRuns.runs) && typeof cachedRuns.cachedAt === 'string';
};

const isCachedRunDetails = (value: unknown): value is CachedRunDetails => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const cachedDetails = value as Partial<CachedRunDetails>;
  const details = cachedDetails.details as Partial<RunDetails> | undefined;

  return Boolean(details?.run) && Array.isArray(details?.items) && typeof cachedDetails.cachedAt === 'string';
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

export const loadCachedRuns = (): CachedRuns | null => {
  try {
    const cachedRuns = localStorage.getItem(RUNS_CACHE_KEY);

    if (!cachedRuns) {
      return null;
    }

    const parsedRuns = JSON.parse(cachedRuns) as unknown;

    if (!isCachedRuns(parsedRuns)) {
      return null;
    }

    return parsedRuns;
  } catch {
    return null;
  }
};

export const saveCachedRuns = (runs: Run[]): CachedRuns | null => {
  const cachedRuns = {
    runs,
    cachedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(RUNS_CACHE_KEY, JSON.stringify(cachedRuns));
    return cachedRuns;
  } catch {
    return null;
  }
};

export const addCachedRun = (run: Run): CachedRuns | null => {
  const cachedRuns = loadCachedRuns();
  const currentRuns = cachedRuns?.runs ?? [];
  const nextRuns = [run, ...currentRuns.filter((currentRun) => currentRun.id !== run.id)];

  return saveCachedRuns(nextRuns);
};

export const removeCachedRun = (runId: string): CachedRuns | null => {
  const cachedRuns = loadCachedRuns();

  if (!cachedRuns) {
    return null;
  }

  return saveCachedRuns(cachedRuns.runs.filter((run) => run.id !== runId));
};

export const loadCachedRunDetails = (runId: string): CachedRunDetails | null => {
  try {
    const cachedDetails = localStorage.getItem(`${RUN_DETAILS_CACHE_KEY_PREFIX}${runId}`);

    if (!cachedDetails) {
      return null;
    }

    const parsedDetails = JSON.parse(cachedDetails) as unknown;

    if (!isCachedRunDetails(parsedDetails)) {
      return null;
    }

    return parsedDetails;
  } catch {
    return null;
  }
};

export const saveCachedRunDetails = (runId: string, details: RunDetails): CachedRunDetails | null => {
  const cachedDetails = {
    details,
    cachedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(`${RUN_DETAILS_CACHE_KEY_PREFIX}${runId}`, JSON.stringify(cachedDetails));
    return cachedDetails;
  } catch {
    return null;
  }
};

export const removeCachedRunDetails = (runId: string): void => {
  try {
    localStorage.removeItem(`${RUN_DETAILS_CACHE_KEY_PREFIX}${runId}`);
  } catch {
    // Ignore unavailable localStorage. Google remains the source of truth for run details.
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