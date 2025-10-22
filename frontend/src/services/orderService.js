import api from './api';

export const orderService = {
  getAllOrders: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrderStats: async () => {
    const response = await api.get('/orders/stats/summary');
    return response.data;
  },
};

