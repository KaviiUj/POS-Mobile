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

  placeOrder: async (orderData) => {
    const response = await api.post('/order/place', orderData);
    return response.data;
  },

  verifySessionPin: async (sessionPin, tableId) => {
    const response = await api.post('/order/verify-pin', {
      sessionPin,
      tableId,
    });
    return response.data;
  },

  settleBill: async (paymentMethod) => {
    const response = await api.patch(`/order/settle?paymentMethod=${paymentMethod}`);
    return response.data;
  },

  getOrderStats: async () => {
    const response = await api.get('/orders/stats/summary');
    return response.data;
  },
};

