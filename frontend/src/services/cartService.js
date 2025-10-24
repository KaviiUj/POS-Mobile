import api from './api';

export const cartService = {
  addToCart: async (itemId, tableId, tableName) => {
    console.log('🔍 Adding to cart - itemId:', itemId, 'type:', typeof itemId);
    console.log('🔍 Request payload:', {
      itemId: String(itemId),
      tableId,
      tableName
    });
    const response = await api.post('/cart/add', {
      itemId: String(itemId), // Ensure it's a string
      tableId,
      tableName,
    });
    console.log('🔍 Response:', response.data);
    return response.data;
  },
  
  updateCart: async (cartId, itemId) => {
    console.log('🔍 Updating cart - itemId:', itemId, 'type:', typeof itemId);
    console.log('🔍 Request payload:', {
      itemId: String(itemId)
    });
    const response = await api.put(`/cart/update?cartId=${cartId}`, {
      itemId: String(itemId), // Ensure it's a string
    });
    console.log('🔍 Response:', response.data);
    return response.data;
  },

  // Get cart items (GET /cart)
  getCart: async (cartId) => {
    try {
      const response = await api.get(`/cart?cartId=${cartId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get cart:', error);
      throw error;
    }
  },

  // Delete item from cart (DELETE /cart/item)
  deleteItem: async (cartId, itemId) => {
    try {
      const response = await api.delete(`/cart/item?cartId=${cartId}&itemId=${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete item from cart:', error);
      throw error;
    }
  },

  // Delete entire cart (DELETE /cart)
  deleteCart: async (cartId) => {
    try {
      const response = await api.delete(`/cart?cartId=${cartId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete cart:', error);
      throw error;
    }
  },
};

export default cartService;

