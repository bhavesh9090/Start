import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : (BASE_URL ? `${BASE_URL}/api` : '/api');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  sendOTP: (mobile) => api.post('/auth/send-otp', { mobile }),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getDistricts: () => api.get('/auth/districts'),
};

// ==================== TAXES ====================
export const taxAPI = {
  getUserTaxes: (year) => api.get(`/taxes${year ? `?year=${year}` : ''}`),
  getTaxById: (id) => api.get(`/taxes/${id}`),
  getAllTaxes: (params) => api.get('/taxes/all', { params }),
  generateTaxes: (data) => api.post('/taxes/generate', data),
  getAnalytics: (year) => api.get(`/taxes/analytics${year ? `?year=${year}` : ''}`),
};

// ==================== PAYMENTS ====================
export const paymentAPI = {
  createOrder: (tax_id) => api.post('/payments/create-order', { tax_id }),
  verifyPayment: (data) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
  downloadReceipt: (id) => api.get(`/payments/receipt/${id}`, { responseType: 'blob' }),
  getAllPayments: () => api.get('/payments/all'),
};

// ==================== COMPLAINTS ====================
export const complaintAPI = {
  create: (data) => api.post('/complaints', data),
  getUserComplaints: () => api.get('/complaints/my'),
  getAll: (status) => api.get('/complaints/all', { params: { status } }),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
};

// ==================== NOTICES ====================
export const noticeAPI = {
  getUserNotices: () => api.get('/notices'),
  getAll: () => api.get('/notices/all'),
  create: (data) => api.post('/notices', data),
  autoGenerate: (data) => api.post('/notices/auto-generate', data),
  delete: (id) => api.delete(`/notices/${id}`),
};

// ==================== ADMIN ====================
export const adminAPI = {
  getDashboard: (params) => api.get('/admin/dashboard', { params }),
  getAdvancedAnalytics: (params) => api.get('/admin/analytics/advanced', { params }),
  getAdminProfile: () => api.get('/admin/profile'),
  updateAdminProfile: (data) => api.put('/admin/profile', data),
  getUsers: (params) => api.get('/admin/users', { params }),
  unlockUser: (id) => api.put(`/admin/users/${id}/unlock`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getUpdates: () => api.get('/admin/updates'),
  createUpdate: (data) => api.post('/admin/updates', data),
  getNotifications: () => api.get('/admin/notifications'),
  markNotificationRead: (id) => api.put(`/admin/notifications/${id}/read`),
};

// ==================== MONTHLY TAX ====================
export const monthlyTaxAPI = {
  getPayments: () => api.get('/monthly-tax'),
  getAllPayments: (params) => api.get('/monthly-tax/all', { params }),
  createOrder: (month, year) => api.post('/monthly-tax/order', { month, year }),
  verifyPayment: (data) => api.post('/monthly-tax/verify', data),
  downloadReceipt: (id) => api.get(`/monthly-tax/receipt/${id}`, { responseType: 'blob' }),
  deletePayment: (id) => api.delete(`/monthly-tax/${id}`),
};

// ==================== HELP ====================
export const helpAPI = {
  submit: (data) => api.post('/help/submit', data),
};

export default api;
