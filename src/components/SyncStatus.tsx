interface SyncStatusProps {
  error: string | null;
  isAutoRefreshEnabled: boolean;
  isRefreshing: boolean;
  isUsingCache: boolean;
}

export const SyncStatus = ({ error, isAutoRefreshEnabled, isRefreshing, isUsingCache }: SyncStatusProps) => {
  if (error) {
    return <div className="sync-status sync-status-error">Ошибка синхронизации</div>;
  }

  if (isRefreshing) {
    return <div className="sync-status">Синхронизация...</div>;
  }

  if (isUsingCache && isRefreshing) {
    return <div className="sync-status">Показан кэш, обновляем...</div>;
  }

  return (
    <div className="sync-status">
      {isAutoRefreshEnabled ? 'Синхронизация: активна' : 'Синхронизация: отключена'}
    </div>
  );
};