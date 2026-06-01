import { SyncStatus } from './SyncStatus';

interface HeaderProps {
  error: string | null;
  isAutoRefreshEnabled: boolean;
  isRefreshing: boolean;
}

export const Header = ({ error, isAutoRefreshEnabled, isRefreshing }: HeaderProps) => {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Черный рынок Albion Online</p>
        <h1>Albion Black Market Tracker</h1>
        <p className="subtitle">Учет торговли на черном рынке</p>
      </div>

      <div className="header-aside" aria-label="Статусы участников и синхронизации">
        <div className="online-card">
          <span>Макс</span>
          <strong>Онлайн</strong>
        </div>
        <div className="online-card">
          <span>Друг</span>
          <strong>Онлайн</strong>
        </div>
        <SyncStatus error={error} isAutoRefreshEnabled={isAutoRefreshEnabled} isRefreshing={isRefreshing} />
      </div>
    </header>
  );
};