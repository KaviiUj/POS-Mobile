import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';

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
  (response) => {
    // Check for sessionEnded flag in successful responses too
    const data = response.data;
    if (data?.sessionEnded || data?.requiresNewScan) {
      const authStore = useAuthStore.getState();
      
      // Only handle if user is still logged in
      if (authStore.accessToken) {
        authStore.logout();
        
        // Clear table store since session is ended
        useTableStore.getState().clearTable();
        
        // Redirect to login page with thank you message
        const message = 'Thank you for ordering with us!';
        window.location.href = `/login?message=${encodeURIComponent(message)}`;
      }
    }
    return response;
  },
  (error) => {
    const response = error.response;
    
    if (response?.status === 401) {
      const data = response.data;
      
      // Check if session has ended or expired (customer needs to scan QR again)
      if (data?.sessionEnded || data?.sessionExpired || data?.requiresNewScan) {
        useAuthStore.getState().logout();
        
        // Clear table store since session is ended
        useTableStore.getState().clearTable();
        
        // Redirect to login page with thank you message
        const message = 'Thank you for ordering with us!';
        window.location.href = `/login?message=${encodeURIComponent(message)}`;
        
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
              useTableStore.getState().clearTable();
              window.location.href = '/login?message=Session expired. Please scan the QR code again.';
              return Promise.reject(error);
            });
        }
      }
      
      // Default 401 handling - logout and redirect to login
      useAuthStore.getState().logout();
      useTableStore.getState().clearTable();
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;

