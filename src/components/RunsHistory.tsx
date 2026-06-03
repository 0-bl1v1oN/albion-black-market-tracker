import { useMemo, useState } from 'react';
import { RunDetails } from './RunDetails';
import { useRuns } from '../hooks/useRuns';
import type { RunSortOption } from '../types/run';
import { formatDateTime, formatPrice, formatRoi, getProfitClassName } from '../utils/format';

interface RunsHistoryProps {
  isActive: boolean;
}

export const RunsHistory = ({ isActive }: RunsHistoryProps) => {
  const {
    runs,
    selectedRunDetails,
    isLoadingRuns,
    isLoadingDetails,
    error,
    successMessage,
    loadRuns,
    loadRunDetails,
    deleteRun,
    clearMessages,
    clearSelectedRunDetails,
  } = useRuns({ enabled: isActive });
  const [commentSearch, setCommentSearch] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('Все');
  const [sortOption, setSortOption] = useState<RunSortOption>('dateDesc');

  const createdByOptions = useMemo(() => {
    const uniqueCreators = Array.from(new Set(runs.map((run) => run.createdBy).filter(Boolean))).sort((first, second) => first.localeCompare(second, 'ru'));
    return ['Все', ...uniqueCreators];
  }, [runs]);

  const visibleRuns = useMemo(() => {
    const normalizedSearch = commentSearch.trim().toLowerCase();

    return [...runs]
      .filter((run) => run.comment.toLowerCase().includes(normalizedSearch))
      .filter((run) => (createdByFilter === 'Все' ? true : run.createdBy === createdByFilter))
      .sort((first, second) => {
        switch (sortOption) {
          case 'dateAsc':
            return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
          case 'profitDesc':
            return second.totalProfit - first.totalProfit;
          case 'roiDesc':
            return second.roi - first.roi;
          case 'dateDesc':
          default:
            return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
        }
      });
  }, [commentSearch, createdByFilter, runs, sortOption]);

  const handleResetFilters = () => {
    setCommentSearch('');
    setCreatedByFilter('Все');
    setSortOption('dateDesc');
  };

  const handleDeleteRun = async (runId: string) => {
    const run = runs.find((currentRun) => currentRun.id === runId);
    const isConfirmed = confirm(`Удалить ходку от ${run ? formatDateTime(run.createdAt) : 'выбранной даты'}?`);

    if (!isConfirmed) {
      return;
    }

    await deleteRun(runId).catch(() => undefined);
  };

  return (
    <div className="history-page">
      {successMessage && <div className="app-warning app-success" role="status">{successMessage}</div>}
      {error && <div className="app-warning app-warning-error" role="alert">{error}</div>}

      <section className="controls-panel history-controls" aria-label="Фильтры истории ходок">
        <label className="field field-search">
          <span>Поиск по комментарию</span>
          <input value={commentSearch} type="search" onChange={(event) => setCommentSearch(event.target.value)} placeholder="Например, вечерняя" />
        </label>
        <label className="field">
          <span>Кто сделал ходку</span>
          <select value={createdByFilter} onChange={(event) => setCreatedByFilter(event.target.value)}>
            {createdByOptions.map((creator) => (
              <option key={creator} value={creator}>{creator}</option>
            ))}
          </select>
        </label>
        <label className="field field-sort">
          <span>Сортировка</span>
          <select value={sortOption} onChange={(event) => setSortOption(event.target.value as RunSortOption)}>
            <option value="dateDesc">По дате новые</option>
            <option value="dateAsc">По дате старые</option>
            <option value="profitDesc">Профит по убыванию</option>
            <option value="roiDesc">ROI по убыванию</option>
          </select>
        </label>
        <div className="controls-actions">
          <button className="button button-secondary" type="button" onClick={handleResetFilters}>Сброс</button>
          <button className="button button-secondary" type="button" onClick={() => void loadRuns().catch(() => undefined)}>Обновить</button>
          <button className="button button-secondary" type="button" onClick={clearMessages}>Скрыть сообщения</button>
        </div>
      </section>

      <section className="table-card" aria-label="История завершенных ходок">
        <div className="table-heading">
          <div>
            <h2>История ходок</h2>
            <p>Детали загружаются только при открытии конкретной ходки</p>
          </div>
          <span>{isLoadingRuns ? 'Загрузка...' : `${visibleRuns.length} найдено`}</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Кто сделал ходку</th>
                <th>Предметов</th>
                <th>Закуп</th>
                <th>Продажа</th>
                <th>Профит</th>
                <th>ROI</th>
                <th>Комментарий</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {visibleRuns.length === 0 ? (
                <tr>
                  <td className="empty-table" colSpan={9}>{isLoadingRuns ? 'Загружаем историю...' : 'Ходки не найдены.'}</td>
                </tr>
              ) : (
                visibleRuns.map((run) => (
                  <tr key={run.id} className={selectedRunDetails?.run.id === run.id ? 'selected-row' : undefined} onDoubleClick={() => void loadRunDetails(run.id).catch(() => undefined)}>
                    <td>{formatDateTime(run.createdAt)}</td>
                    <td>{run.createdBy}</td>
                    <td>{run.totalItems}</td>
                    <td>{formatPrice(run.totalBuy)}</td>
                    <td>{formatPrice(run.totalSell)}</td>
                    <td className={getProfitClassName(run.totalProfit)}>{formatPrice(run.totalProfit)}</td>
                    <td className={getProfitClassName(run.roi)}>{formatRoi(run.roi)}</td>
                    <td className="item-name-cell">{run.comment || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" onClick={() => void loadRunDetails(run.id).catch(() => undefined)}>Подробнее</button>
                        <button type="button" onClick={() => void handleDeleteRun(run.id)}>Удалить</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <RunDetails details={selectedRunDetails} isLoading={isLoadingDetails} onClose={clearSelectedRunDetails} />
    </div>
  );
};
