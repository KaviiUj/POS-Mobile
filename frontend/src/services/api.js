import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    
    if (response?.status === 401) {
      const data = response.data;
      
      // Check if session has ended or expired (customer needs to scan QR again)
      if (data?.sessionEnded || data?.sessionExpired || data?.requiresNewScan) {
        useAuthStore.getState().logout();
        
        // Redirect to home/QR scan page with message
        const message = data.message || 'Your session has ended. Please scan the QR code again.';
        window.location.href = `/?message=${encodeURIComponent(message)}`;
        
        return Promise.reject(error);
      }
      
      // Check if token needs refresh
      if (data?.requiresRefresh) {
        // Attempt token refresh
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (refreshToken) {
          return api.post('/customer/refresh-token', { refreshToken })
            .then(res => {
              const { accessToken } = res.data.data;
              useAuthStore.getState().setAuth(
                useAuthStore.getState().customer,
                accessToken,
                refreshToken
              );
              
              // Retry original request
              error.config.headers.Authorization = `Bearer ${accessToken}`;
              return api.request(error.config);
            })
            .catch(() => {
              // Refresh failed, logout and redirect
              useAuthStore.getState().logout();
              window.location.href = '/?message=Session expired. Please scan the QR code again.';
              return Promise.reject(error);
            });
        }
      }
      
      // Default 401 handling - logout and redirect to login
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

