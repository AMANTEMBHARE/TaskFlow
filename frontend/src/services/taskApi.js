import api from './api';

export const listTasks = async (params) => (await api.get('/tasks', { params })).data.data;

export const createTask = async (payload) => (await api.post('/tasks', payload)).data.data.task;

export const updateTask = async (id, payload) => (await api.patch(`/tasks/${id}`, payload)).data.data.task;

export const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}`);
};
