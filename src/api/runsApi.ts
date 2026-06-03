import type { CreateRunPayload, Run, RunDetails } from '../types/run';

type RunsAction = 'createRun' | 'listRuns' | 'getRunDetails' | 'deleteRun';

type RunsApiResponse = {
  ok: boolean;
  run?: Run;
  runs?: Run[];
  details?: RunDetails;
  items?: RunDetails['items'];
  error?: string;
};

const getAppsScriptUrl = (): string => import.meta.env.VITE_APPS_SCRIPT_URL?.trim() ?? '';
const getSecretKey = (): string => import.meta.env.VITE_SECRET_KEY?.trim() ?? '';

const requestRunsApi = async <T>(action: RunsAction, payload: unknown = {}): Promise<T> => {
  const apiUrl = getAppsScriptUrl();
  const secret = getSecretKey();

  if (!apiUrl) {
    throw new Error('Не задан VITE_APPS_SCRIPT_URL. История ходок доступна только через Google Apps Script.');
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

  const data = (await response.json()) as RunsApiResponse;

  if (!data.ok) {
    throw new Error(data.error || 'Google Apps Script вернул ошибку без описания.');
  }

  return data as T;
};

export const createRun = async (payload: CreateRunPayload): Promise<Run> => {
  const data = await requestRunsApi<RunsApiResponse>('createRun', payload);

  if (!data.run) {
    throw new Error('Google Apps Script не вернул созданную ходку.');
  }

  return data.run;
};

export const listRuns = async (): Promise<Run[]> => {
  const data = await requestRunsApi<RunsApiResponse>('listRuns');
  return data.runs ?? [];
};

export const getRunDetails = async (runId: string): Promise<RunDetails> => {
  const data = await requestRunsApi<RunsApiResponse>('getRunDetails', { runId });

  if (data.details) {
    return data.details;
  }

  if (data.run) {
    return {
      run: data.run,
      items: data.items ?? [],
    };
  }

  throw new Error('Google Apps Script не вернул детали ходки.');
};

export const deleteRun = async (runId: string): Promise<void> => {
  await requestRunsApi<RunsApiResponse>('deleteRun', { runId });
};
