import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('zt_token');
      localStorage.removeItem('zt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  getMe: () =>
    api.get('/auth/me'),
};

export const attackAPI = {
  simulate: (type, payload, options = {}) =>
    api.post('/attacks/simulate', { type, payload, options }),
  getTypes: () =>
    api.get('/attacks/types'),
  getHistory: () =>
    api.get('/attacks/history'),
};

export const defenseAPI = {
  get: () =>
    api.get('/defenses'),
  update: (updates) =>
    api.put('/defenses', updates),
};

export const logsAPI = {
  getLogs: (page = 1, limit = 20) =>
    api.get('/logs', { params: { page, limit } }),
  getAlerts: () =>
    api.get('/logs/alerts'),
};

export default api;
