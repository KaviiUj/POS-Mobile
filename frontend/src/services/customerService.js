import api from './api';

export const customerService = {
  register: async (mobileNumber, mobileType, uniqueId, tableId = null, tableName = '') => {
    const response = await api.post('/customer/register', {
      mobileNumber: parseInt(mobileNumber),
      mobileType,
      uniqueId,
      tableId,
      tableName,
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/customer/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/customer/me');
    return response.data;
  },
};

export default customerService;

