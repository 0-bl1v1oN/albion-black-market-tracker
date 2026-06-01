export const Header = () => {
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
        <div className="sync-status">Синхронизация: моковый режим</div>
      </div>
    </header>
  );
};