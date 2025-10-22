/**
 * Common Constants for POS Mobile Application
 */

export const MOBILE_PREFIX = '+94';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

export const APP_NAME = 'POS Mobile';

export const BASE_URL = window.location.origin;

export default {
  MOBILE_PREFIX,
  API_BASE_URL,
  APP_NAME,
  BASE_URL,
};

