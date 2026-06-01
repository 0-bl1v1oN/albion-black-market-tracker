interface SyncStatusProps {
  error: string | null;
  isAutoRefreshEnabled: boolean;
  isRefreshing: boolean;
}

export const SyncStatus = ({ error, isAutoRefreshEnabled, isRefreshing }: SyncStatusProps) => {
  if (error) {
    return <div className="sync-status sync-status-error">Ошибка синхронизации</div>;
  }

  if (isRefreshing) {
    return <div className="sync-status">Синхронизация...</div>;
  }

  return (
    <div className="sync-status">
      {isAutoRefreshEnabled ? 'Синхронизация: активна' : 'Синхронизация: отключена'}
    </div>
  );
};