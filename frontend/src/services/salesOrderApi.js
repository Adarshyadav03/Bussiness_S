import api from './api';

export const getSalesOrdersApi = async () => {
  const res = await api.get('/sales-orders');
  return res.data;
};

export const getSalesOrderByIdApi = async (id) => {
  const res = await api.get(`/sales-orders/${id}`);
  return res.data;
};

export const confirmSalesOrderApi = async (id) => {
  const res = await api.post(`/sales-orders/${id}/confirm`);
  return res.data;
};

export const dispatchSalesOrderApi = async (id, dispatchData) => {
  const res = await api.post(`/sales-orders/${id}/dispatch`, dispatchData);
  return res.data;
};
