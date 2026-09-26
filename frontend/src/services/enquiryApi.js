import api from './api';

export const getEnquiriesApi = async () => {
  const res = await api.get('/enquiries');
  return res.data;
};

export const getEnquiryByIdApi = async (id) => {
  const res = await api.get(`/enquiries/${id}`);
  return res.data;
};

export const createEnquiryApi = async (data) => {
  const res = await api.post('/enquiries', data);
  return res.data;
};
