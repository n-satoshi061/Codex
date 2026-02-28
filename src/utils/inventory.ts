const parseDateString = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);

  if (!year || !month || !day) {
    return new Date(dateString);
  }

  return new Date(year, month - 1, day);
};

export const daysUntil = (dateString: string) => {
  if (!dateString) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = parseDateString(dateString);
  target.setHours(0, 0, 0, 0);

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const isExpired = (dateString: string) => {
  const remaining = daysUntil(dateString);
  return remaining !== null && remaining < 0;
};
