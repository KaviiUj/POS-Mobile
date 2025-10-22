/**
 * Encryption/decryption utilities for URL params
 * Uses Base64 encoding for basic obfuscation
 */

/**
 * Encrypt a value using Base64 encoding
 */
const encrypt = (value) => {
  try {
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    return Buffer.from(encodeURIComponent(str)).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
};

/**
 * Decrypt a value from Base64 encoding
 */
const decrypt = (encryptedValue) => {
  try {
    const decoded = decodeURIComponent(Buffer.from(encryptedValue, 'base64').toString('utf-8'));
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

module.exports = {
  encrypt,
  decrypt,
};

