import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Tailwind CSS class merger
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Get current locale from document lang or default to English
const getCurrentLocale = () => {
  const htmlLang = document.documentElement.lang;
  const direction = document.documentElement.dir;
  
  if (direction === 'rtl' || htmlLang === 'ar') {
    return 'ar-SA';
  }
  return 'en-US';
};

// Format currency
export function formatCurrency(amount, currency = 'SAR', locale = null) {
  const currentLocale = locale || getCurrentLocale();
  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    return `${amount} ${currency}`;
  }
}

// Format number with thousands separator
export function formatNumber(number, locale = null) {
  const currentLocale = locale || getCurrentLocale();
  try {
    return new Intl.NumberFormat(currentLocale).format(number);
  } catch (error) {
    return number?.toString() || '0';
  }
}

// Format percentage
export function formatPercentage(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

// Get current language from document
const getCurrentLanguage = () => {
  const direction = document.documentElement.dir;
  const htmlLang = document.documentElement.lang;
  
  if (direction === 'rtl' || htmlLang === 'ar') {
    return 'ar';
  }
  return 'en';
};

// Format date
export function formatDate(date, formatStr = 'PPP', locale = null) {
  const currentLocale = locale || getCurrentLanguage();
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return '';
    
    const dateLocale = currentLocale === 'ar' ? ar : enUS;
    return format(parsedDate, formatStr, { locale: dateLocale });
  } catch (error) {
    return '';
  }
}

// Format relative time
export function formatRelativeTime(date, locale = null) {
  const currentLocale = locale || getCurrentLanguage();
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return '';
    
    const dateLocale = currentLocale === 'ar' ? ar : enUS;
    return formatDistanceToNow(parsedDate, { 
      addSuffix: true, 
      locale: dateLocale 
    });
  } catch (error) {
    return '';
  }
}

// Truncate text
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Capitalize first letter
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Generate random ID
export function generateId(prefix = '') {
  const id = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${id}` : id;
}

// Validate email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (basic)
export function isValidPhone(phone) {
  const phoneRegex = /^[\+]?[0-9\-\(\)\s]+$/;
  return phoneRegex.test(phone) && phone.length >= 10;
}

// Get color by status
export function getStatusColor(status) {
  const colors = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-red-600 bg-red-100',
    pending: 'text-yellow-600 bg-yellow-100',
    completed: 'text-blue-600 bg-blue-100',
    cancelled: 'text-gray-600 bg-gray-100',
    expired: 'text-red-600 bg-red-100',
    redeemed: 'text-green-600 bg-green-100',
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

// Get priority color
export function getPriorityColor(priority) {
  const colors = {
    high: 'text-red-600 bg-red-100',
    medium: 'text-yellow-600 bg-yellow-100',
    low: 'text-green-600 bg-green-100',
  };
  return colors[priority] || 'text-gray-600 bg-gray-100';
}

// Download file
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
}

// Debounce function
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Throttle function
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Deep clone object
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// Get contrast color
export function getContrastColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

// Convert file to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Parse error message
export function parseErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
}

// Calculate percentage change
export function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// Format file size
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
} 