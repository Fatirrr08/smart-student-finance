/**
 * Checks if a given date string is within the current week (Monday to Sunday).
 * @param {string} dateStr - Date string (YYYY-MM-DD or similar)
 * @returns {boolean}
 */
export const isCurrentWeek = (dateStr) => {
  if (!dateStr) return false;
  const targetDate = new Date(dateStr);
  const now = new Date();
  
  // Set to start of today
  now.setHours(0, 0, 0, 0);
  
  // Get Monday of current week
  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Get Sunday of current week
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return targetDate >= startOfWeek && targetDate <= endOfWeek;
};

/**
 * Checks if a given date string is within the current month.
 * @param {string} dateStr - Date string
 * @returns {boolean}
 */
export const isCurrentMonth = (dateStr) => {
  if (!dateStr) return false;
  const targetDate = new Date(dateStr);
  const now = new Date();
  return (
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getFullYear() === now.getFullYear()
  );
};

/**
 * Formats a date to Indonesian locale string.
 */
export const formatIndoDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};
