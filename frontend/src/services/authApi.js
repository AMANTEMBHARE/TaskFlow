import api from './api';

export const registerUser = async (payload) => (await api.post('/auth/register', payload)).data.data.user;

export const loginUser = async (payload) => (await api.post('/auth/login', payload)).data.data.user;

export const logoutUser = async () => {
  await api.post('/auth/logout');
};

export const fetchCurrentUser = async () => (await api.get('/auth/me')).data.data.user;
