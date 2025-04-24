import axios from 'axios';
import { secureSet,secureGet } from '../utils/secureStorage';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true,
});

// 👉 Add access token to every request
api.interceptors.request.use(
  (config) => {
    const token = secureGet('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshRes = await api.post('/refresh');
        const { accessToken } = refreshRes.data;

        secureSet('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token invalid', refreshError);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default api;
