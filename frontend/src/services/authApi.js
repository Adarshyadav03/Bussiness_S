import api from './api';

export const loginApi = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};
