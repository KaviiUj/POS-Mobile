import api from './api';

export const categoryService = {
  getCategories: async () => {
    const response = await api.get('/category');
    return response.data;
  },
};

export default categoryService;
