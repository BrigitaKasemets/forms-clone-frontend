import axios from 'axios';

// Log the API base URL to help with debugging
console.log('API base URL:', process.env.NODE_ENV === 'production' ? 'Production URL' : 'http://localhost:3000');

// Loome axios'i instantsi, mis on eelkonfigureeritud meie API jaoks
const api = axios.create({
  baseURL: 'http://localhost:3000', // Konkreetne baseURL
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent request hanging
  timeout: 10000,
});

// Lisame interceptori, mis lisab JWT tokeni Authorization päisesse
api.interceptors.request.use(
  (config) => {
    // Need endpoints don't need authentication tokens
    const noAuthRequired = [
      '/sessions', // Login endpoint
      '/users' // Registration endpoint (POST)
    ];
    
    // Check if the current request is to an endpoint that doesn't require auth
    const isAuthExempt = noAuthRequired.some(endpoint => 
      config.url === endpoint && ['POST'].includes(config.method?.toUpperCase())
    );
    
    if (isAuthExempt) {
      console.log('Auth exempt request:', config.url);
      return config;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
    } else {
      console.warn('No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Lisame interceptori, mis käsitleb vastuseid
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
    // Kui saame 401 (Unauthorized), siis oleme ilmselt tokeni kaotanud
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token'); // eemaldame kehtetud tokeni
      window.location.href = '/login'; // suuname kasutaja sisselogimislehele
    }
    return Promise.reject(error);
  }
);

export default api;

