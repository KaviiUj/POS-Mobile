/**
 * Device utility functions
 */

export const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  
  // Default to android for web and android devices
  return 'android';
};

export const getUniqueDeviceId = () => {
  let uniqueId = localStorage.getItem('device_unique_id');
  
  if (!uniqueId) {
    uniqueId = Date.now() + Math.floor(Math.random() * 1000000);
    localStorage.setItem('device_unique_id', uniqueId);
  }
  
  return parseInt(uniqueId);
};

export default {
  getDeviceType,
  getUniqueDeviceId,
};

