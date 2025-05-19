import axios from 'axios';

// Loome axios'i instantsi, mis on eelkonfigureeritud meie API jaoks
// Kuna kasutame proxy seadistust package.json failis, ei pea me otseselt baas URL-i määrama
const api = axios.create({
  baseURL: '', // Tühi baasURL, sest proxy hoolitseb marsruutimise eest
  headers: {
    'Content-Type': 'application/json',
  }
});

// Lisame interceptori, mis lisab JWT tokeni Authorization päisesse
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    // Kui saame 401 (Unauthorized), siis oleme ilmselt tokeni kaotanud
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token'); // eemaldame kehtetud tokeni
      window.location.href = '/login'; // suuname kasutaja sisselogimislehele
    }
    return Promise.reject(error);
  }
);

export default api;