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

  getOrderById: async (orderId) => {
    const response = await api.get(`/order/get?orderId=${orderId}`);
    return response.data;
  },

  addItemsToOrder: async (orderId, items, sessionPin) => {
    const response = await api.put(`/order/add-items?orderId=${orderId}`, {
      items,
      sessionPin
    });
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

