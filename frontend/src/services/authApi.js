import api from './api';

export const loginApi = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const signupApi = async (userData) => {
  const res = await api.post('/auth/signup', userData);
  return res.data;
};
