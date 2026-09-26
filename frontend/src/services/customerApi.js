import api from './api';

export const getCustomersApi = async () => {
  const res = await api.get('/customers');
  return res.data;
};

export const createCustomerApi = async (data) => {
  const res = await api.post('/customers', data);
  return res.data;
};
