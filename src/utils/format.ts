export const formatPrice = (value: number): string => Math.round(value).toLocaleString('ru-RU').replace(/\u00a0/g, ' ');

export const formatRoi = (value: number): string => `${value.toFixed(1)}%`;

export const formatDateTime = (isoDate: string): string => {
  if (isoDate === 'Нет данных') {
    return isoDate;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
};

export const getProfitClassName = (profit: number): string => {
  if (profit > 0) {
    return 'profit-positive';
  }

  if (profit < 0) {
    return 'profit-negative';
  }

  return 'profit-neutral';
};