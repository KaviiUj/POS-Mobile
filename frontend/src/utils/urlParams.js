/**
 * URL parameter utilities
 */

import { decrypt } from './encryption';

/**
 * Extract and decrypt query parameters from URL
 * @param {URLSearchParams} searchParams - The URL search params
 * @returns {Object} - Extracted params { tableName, tableId, mobileNumber }
 */
export const extractEncryptedParams = (searchParams) => {
  const result = {
    tableName: null,
    tableId: null,
    mobileNumber: null,
  };

  try {
    // Check if we have a single encrypted data token (new format)
    const encryptedData = searchParams.get('t');
    
    if (encryptedData) {
      const decryptedData = decrypt(encryptedData);
      if (decryptedData && typeof decryptedData === 'object') {
        result.tableName = decryptedData.tableName || null;
        result.tableId = decryptedData.tableId || null;
        result.mobileNumber = decryptedData.mobileNumber || null;
      }
      return result;
    }

    // Fallback: Check for separate encrypted params (old format)
    const encryptedTableName = searchParams.get('t');
    const encryptedTableId = searchParams.get('tid');
    const encryptedMobileNumber = searchParams.get('m');

    if (encryptedTableName) {
      result.tableName = decrypt(encryptedTableName);
    }

    if (encryptedTableId) {
      result.tableId = decrypt(encryptedTableId);
    }

    if (encryptedMobileNumber) {
      result.mobileNumber = decrypt(encryptedMobileNumber);
    }

    return result;
  } catch (error) {
    console.error('Error extracting encrypted params:', error);
    return result;
  }
};

/**
 * Clear query parameters from URL without page reload
 * @param {Function} navigate - React Router navigate function
 * @param {string} path - The clean path to navigate to
 */
export const clearUrlParams = (navigate, path) => {
  // Use replace to avoid adding to browser history
  navigate(path, { replace: true });
};

/**
 * Alternative: Clear params using window.history
 */
export const clearUrlParamsWithHistory = () => {
  const url = new URL(window.location.href);
  const cleanUrl = `${url.origin}${url.pathname}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

export default {
  extractEncryptedParams,
  clearUrlParams,
  clearUrlParamsWithHistory,
};

