/**
 * Encryption/decryption utilities for URL params
 * Uses Base64 encoding for basic obfuscation
 * Note: This is obfuscation, not cryptographic security
 */

/**
 * Encrypt a value using Base64 encoding
 */
export const encrypt = (value) => {
  try {
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return btoa(encodeURIComponent(str));
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Decrypt a value from Base64 encoding
 */
export const decrypt = (encryptedValue) => {
  try {
    const decoded = decodeURIComponent(atob(encryptedValue));
    // Try to parse as JSON, if it fails return as string
    try {
      return JSON.parse(decoded);
    } catch {
      return decoded;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Encrypt multiple params into a single token
 */
export const encryptParams = (params) => {
  return encrypt(params);
};

/**
 * Decrypt params from a token
 */
export const decryptParams = (token) => {
  return decrypt(token);
};

export default {
  encrypt,
  decrypt,
  encryptParams,
  decryptParams,
};

