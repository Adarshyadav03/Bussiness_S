import api from './api';

export const getQuotationsApi = async () => {
  const res = await api.get('/quotations');
  return res.data;
};

export const getQuotationByIdApi = async (id) => {
  const res = await api.get(`/quotations/${id}`);
  return res.data;
};

export const createQuotationApi = async (data) => {
  const res = await api.post('/quotations', data);
  return res.data;
};

export const updateQuotationStatusApi = async (id, status) => {
  const res = await api.patch(`/quotations/${id}/status`, { status });
  return res.data;
};

export const convertQuotationToOrderApi = async (id) => {
  const res = await api.post(`/quotations/${id}/convert`);
  return res.data;
};
