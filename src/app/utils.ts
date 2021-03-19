export const localiseDate = (date: string): string => {
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
};

export const kmb = (num: number): string => {
  if (!isFinite(num)) {
    return num as any;
  }
  const k = num / 1000;
  const m = num / 1000000;
  const b = num / 1000000000;
  if (k < 100) {
    return num.toLocaleString();
  }
  if (m < 1) {
    return Math.round(k).toLocaleString() + 'K';
  }
  if (b < 1) {
    return (+m.toFixed(2)).toLocaleString() + 'M';
  }
  return (+b.toFixed(2)).toLocaleString() + 'B';
};
