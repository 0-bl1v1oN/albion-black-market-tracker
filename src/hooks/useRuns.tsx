import { useCallback, useEffect, useMemo, useState } from 'react';
import * as runsApi from '../api/runsApi';
import type { CreateRunPayload, Run, RunDetails } from '../types/run';
import {
  addCachedRun,
  loadCachedRunDetails,
  loadCachedRuns,
  removeCachedRun,
  removeCachedRunDetails,
  saveCachedRunDetails,
  saveCachedRuns,
} from '../utils/storage';

type UseRunsOptions = {
  enabled: boolean;
};

export const useRuns = ({ enabled }: UseRunsOptions) => {
  const isRemoteConfigured = useMemo(() => Boolean(import.meta.env.VITE_APPS_SCRIPT_URL?.trim()), []);
  const [runs, setRuns] = useState<Run[]>(() => loadCachedRuns()?.runs ?? []);
  const [selectedRunDetails, setSelectedRunDetails] = useState<RunDetails | null>(null);
  const [isLoadingRuns, setIsLoadingRuns] = useState(() => enabled && !loadCachedRuns());
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSavingRun, setIsSavingRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    const cachedRuns = loadCachedRuns();

    if (cachedRuns) {
      setRuns(cachedRuns.runs);
    }
    if (!isRemoteConfigured) {
      setIsLoadingRuns(false);
      setError('VITE_APPS_SCRIPT_URL не задан. История ходок доступна только через Google Apps Script.');
      return cachedRuns?.runs ?? [];
    }

    setIsLoadingRuns(true);
    setError(null);

    try {
      const loadedRuns = await runsApi.listRuns();
      setRuns(loadedRuns);
      saveCachedRuns(loadedRuns);
      return loadedRuns;
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Не удалось синхронизировать историю ходок.';
      setError(cachedRuns ? `${message} Показана история из локального кэша.` : message);

      if (cachedRuns) {
        return cachedRuns.runs;
      }
      throw loadError;
    } finally {
      setIsLoadingRuns(false);
    }
  }, [isRemoteConfigured]);

  const createRun = useCallback(
    async (payload: CreateRunPayload) => {
      setIsSavingRun(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const createdRun = await runsApi.createRun(payload);
        setRuns((currentRuns) => {
          const nextRuns = [createdRun, ...currentRuns.filter((run) => run.id !== createdRun.id)];
          saveCachedRuns(nextRuns);
          return nextRuns;
        });
        addCachedRun(createdRun);
        setSuccessMessage('Ходка успешно сохранена.');
        return createdRun;
      } catch (createError) {
        const message = createError instanceof Error ? createError.message : 'Не удалось завершить ходку.';
        setError(message);
        throw createError;
      } finally {
        setIsSavingRun(false);
      }
    },
    [],
  );

  const loadRunDetails = useCallback(async (runId: string) => {
    const cachedDetails = loadCachedRunDetails(runId);

    if (cachedDetails) {
      setSelectedRunDetails(cachedDetails.details);
    }
    setIsLoadingDetails(true);
    setError(null);

    try {
      const details = await runsApi.getRunDetails(runId);
      setSelectedRunDetails(details);
      saveCachedRunDetails(runId, details);
      return details;
    } catch (detailsError) {
      const message = detailsError instanceof Error ? detailsError.message : 'Не удалось синхронизировать состав ходки.';
      setError(cachedDetails ? `${message} Показан состав ходки из локального кэша.` : message);

      if (cachedDetails) {
        return cachedDetails.details;
      }
      throw detailsError;
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const deleteRun = useCallback(
    async (runId: string) => {
      setError(null);
      setSuccessMessage(null);

      try {
        await runsApi.deleteRun(runId);
        setRuns((currentRuns) => {
          const nextRuns = currentRuns.filter((run) => run.id !== runId);
          saveCachedRuns(nextRuns);
          return nextRuns;
        });
        removeCachedRun(runId);
        removeCachedRunDetails(runId);
        setSelectedRunDetails((currentDetails) => (currentDetails?.run.id === runId ? null : currentDetails));
        setSuccessMessage('Ходка удалена.');
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : 'Не удалось удалить ходку.';
        setError(message);
        throw deleteError;
      }
    },
    [],
  );

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadRuns().catch(() => undefined);
  }, [enabled, loadRuns]);

  return {
    runs,
    selectedRunDetails,
    isLoadingRuns,
    isLoadingDetails,
    isSavingRun,
    error,
    successMessage,
    isRemoteConfigured,
    loadRuns,
    createRun,
    loadRunDetails,
    deleteRun,
    clearMessages,
    clearSelectedRunDetails: () => setSelectedRunDetails(null),
  };
};
