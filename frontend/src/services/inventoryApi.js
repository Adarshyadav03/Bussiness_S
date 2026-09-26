import api from './api';

export const getInventoryApi = async () => {
  const res = await api.get('/inventory');
  return res.data;
};

export const updateInventoryApi = async (productId, data) => {
  const res = await api.patch(`/inventory/${productId}`, data);
  return res.data;
};
