import api from './api';

export const customerService = {
  register: async (mobileNumber, mobileType, uniqueId) => {
    const response = await api.post('/customer/register', {
      mobileNumber: parseInt(mobileNumber),
      mobileType,
      uniqueId,
    });
    return response.data;
  },
};

export default customerService;

