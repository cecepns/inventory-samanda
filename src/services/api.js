import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-inventory.isavralabel.com/inventory-toko-samanda/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getCurrentUser: () => api.get('/auth/me'),
};

// User API
export const userAPI = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Category API
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  createCategory: (categoryData) => api.post('/categories', categoryData),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

// Product API
export const productAPI = {
  getProducts: () => api.get('/products'),
  createProduct: (formData) => api.post('/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, formData) => api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

// Supplier API
export const supplierAPI = {
  getSuppliers: () => api.get('/suppliers'),
  createSupplier: (supplierData) => api.post('/suppliers', supplierData),
  updateSupplier: (id, supplierData) => api.put(`/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`),
};

// Customer API
export const customerAPI = {
  getCustomers: () => api.get('/customers'),
  createCustomer: (customerData) => api.post('/customers', customerData),
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};

// Purchase API
export const purchaseAPI = {
  getPurchases: () => api.get('/purchases'),
  getPurchase: (id) => api.get(`/purchases/${id}`),
  createPurchase: (purchaseData) => api.post('/purchases', purchaseData),
};

// Sale API
export const saleAPI = {
  getSales: () => api.get('/sales'),
  getSale: (id) => api.get(`/sales/${id}`),
  createSale: (saleData) => api.post('/sales', saleData),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Report API
export const reportAPI = {
  getStockReport: () => api.get('/reports/stock'),
  getStockInReport: (startDate, endDate) => 
    api.get('/reports/stock-in', { params: { start_date: startDate, end_date: endDate } }),
  getStockOutReport: (startDate, endDate) =>
    api.get('/reports/stock-out', { params: { start_date: startDate, end_date: endDate } }),
};

export default api;