import api from './api';

export const itemService = {
  getAllItems: async () => {
    const response = await api.get('/item');
    return response.data;
  },
  
  getItemsByCategory: async (categoryId) => {
    const response = await api.get(`/item/category?categoryId=${categoryId}`);
    return response.data;
  },
};

export default itemService;

