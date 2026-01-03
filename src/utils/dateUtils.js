import { format, parseISO } from 'date-fns';

/**
 * Format a date string to a user-friendly format
 * @param {string|Date} date - The date to format
 * @param {string} formatString - The format string (default: 'MMM d, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatString = 'MMM d, yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format a date and time string to a user-friendly format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string (e.g., "Feb 20, 2026 at 9:00 AM")
 */
export const formatDateTime = (date) => {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a");
};

/**
 * Format a time string to 12-hour format
 * @param {string|Date} date - The date/time to format
 * @returns {string} Formatted time string (e.g., "9:00 AM")
 */
export const formatTime = (date) => {
  return formatDate(date, 'h:mm a');
};

/**
 * Format a date range
 * @param {string|Date} startDate - The start date
 * @param {string|Date} endDate - The end date
 * @returns {string} Formatted date range (e.g., "Feb 20, 2026, 9:00 AM - 5:00 PM")
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    const datePart = format(start, 'MMM d, yyyy');
    const startTime = format(start, 'h:mm a');
    const endTime = format(end, 'h:mm a');
    
    return `${datePart}, ${startTime} - ${endTime}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return '';
  }
};

/**
 * Format a date for display in a short format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "Feb 20")
 */
export const formatDateShort = (date) => {
  return formatDate(date, 'MMM d');
};

/**
 * Check if a date is in the past
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return dateObj < new Date();
  } catch (error) {
    return false;
  }
};
