import api from './api';

export const outletService = {
  getOutletConfig: async () => {
    const response = await api.get('/outletConfig');
    return response.data;
  },
};

export default outletService;

