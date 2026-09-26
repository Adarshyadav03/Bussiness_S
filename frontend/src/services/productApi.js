import api from './api';

export const getProductsApi = async () => {
  const res = await api.get('/products');
  return res.data;
};

export const createProductApi = async (data) => {
  const res = await api.post('/products', data);
  return res.data;
};
