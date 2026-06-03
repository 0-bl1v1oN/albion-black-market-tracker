export type AppTab = 'items' | 'trip' | 'history';

interface TabsProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: 'items', label: 'Предметы' },
  { id: 'trip', label: 'Ходка / Корзина' },
  { id: 'history', label: 'История ходок' },
];

export const Tabs = ({ activeTab, onTabChange }: TabsProps) => (
  <nav className="tabs" aria-label="Разделы приложения">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={`tab-button${activeTab === tab.id ? ' tab-button-active' : ''}`}
        type="button"
        onClick={() => onTabChange(tab.id)}
      >
        {tab.label}
      </button>
    ))}
  </nav>
);
