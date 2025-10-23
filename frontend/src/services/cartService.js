import api from './api';

export const cartService = {
  addToCart: async (itemId, tableId, tableName) => {
    const response = await api.post('/cart/add', {
      itemId,
      tableId,
      tableName,
    });
    return response.data;
  },
  
  updateCart: async (cartId, itemId) => {
    const response = await api.put(`/cart/update?cartId=${cartId}`, {
      itemId,
    });
    return response.data;
  },
};

export default cartService;

