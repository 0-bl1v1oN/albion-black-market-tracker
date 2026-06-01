interface SyncStatusProps {
  error: string | null;
  isAutoRefreshEnabled: boolean;
}

export const SyncStatus = ({ error, isAutoRefreshEnabled }: SyncStatusProps) => {
  if (error) {
    return <div className="sync-status sync-status-error">Ошибка синхронизации</div>;
  }

  return (
    <div className="sync-status">
      {isAutoRefreshEnabled ? 'Синхронизация: активна' : 'Синхронизация: отключена'}
    </div>
  );
};