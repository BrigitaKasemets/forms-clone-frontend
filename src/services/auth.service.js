import api from '../utils/axiosConfig';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/sessions', { email, password });
      console.log("Auth service login response:", response.data);
      
      // Salvestame tokeni localStorage'isse, et seda oleks võimalik hiljem kasutada
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log("Token saved to localStorage");
      } else {
        console.error("No token in response data:", response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error("AuthService login error:", error);
      console.error("Response data:", error.response?.data);
      console.error("Status code:", error.response?.status);
      
      // Handle different error types
      let errorMessage = 'Sisselogimine ebaõnnestus. Proovige uuesti.';
      
      if (error.response) {
        // Kui server vastas veateatega
        const status = error.response.status;
        
        // Kontrollime 401 Unauthorized staatuskoodiga vastuseid (vale parool/kasutajanimi)
        if (status === 401 || status === 403) {
          errorMessage = '[AUTH_INVALID_CREDENTIALS] Vale e-posti aadress või parool. Palun proovige uuesti.';
        } else {
          errorMessage = error.response.data?.message || 
                         error.response.data?.error || 
                         `Sisselogimine ebaõnnestus: ${error.response.status}`;
        }
      } else if (error.request) {
        // Kui tehti päring aga server ei vastanud
        errorMessage = 'Serveriga ei õnnestunud ühendust luua. Kontrollige oma internetiühendust.';
      }
      
      // Veendume, et veateade on alati tähistatud vale parooli/kasutajanime puhul
      if (errorMessage.toLowerCase().includes('vale e-posti') || 
          errorMessage.toLowerCase().includes('vale parool') ||
          error.response?.status === 401) {
        // Kui tegu pole juba märgitud veaga, lisame märgistuse
        if (!errorMessage.includes('[AUTH_INVALID_CREDENTIALS]')) {
          errorMessage = "[AUTH_INVALID_CREDENTIALS] " + errorMessage;
        }
      }
      
      // Loome uue vea koos meie tähistatud veatesatega
      throw new Error(errorMessage);
    }
  },
  
  // Ülejäänud meetodid jäävad samaks
  register: async (email, password, name) => {
    try {
      const response = await api.post('/users', { email, password, name });
      
      // Salvestame tokeni localStorage'isse, kui see on olemas
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error("AuthService register error:", error);
      
      // Handle different error types
      let errorMessage = 'Registreerimine ebaõnnestus. Proovige uuesti.';
      
      if (error.response) {
        // Kui server vastas veateatega
        errorMessage = error.response.data?.message || 
                       error.response.data?.error || 
                       `Registreerimine ebaõnnestus: ${error.response.status}`;
      } else if (error.request) {
        // Kui tehti päring aga server ei vastanud
        errorMessage = 'Serveriga ei õnnestunud ühendust luua. Kontrollige oma internetiühendust.';
      }
      
      throw new Error(errorMessage);
    }
  },
  
  logout: async () => {
    try {
      // Kutsume API-st välja, et lõpetada seanss serveripoolselt
      const response = await api.delete('/sessions');
      
      // Eemaldame tokeni localStorage-ist
      localStorage.removeItem('token');
      
      return response.data;
    } catch (error) {
      console.error("AuthService logout error:", error);
      // Isegi kui API kutsung ebaõnnestub, eemaldame tokeni
      localStorage.removeItem('token');
      
      // Veateate loomine ja edastamine
      let errorMessage = 'Väljalogimine ebaõnnestus.';
      if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  },
  
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    console.log("getCurrentUser called, token exists:", !!token);
    
    if (!token) return null;
    
    try {
      // Kui token on olemas, loeme seda kui kasutaja autentimise tõendit
      // Tavalises rakenduses dekodeeriksime JWT tokeni, et saada rohkem infot
      return { 
        isLoggedIn: true,
        token: token 
      };
    } catch (error) {
      console.error("Error getting current user from token:", error);
      // Kui tokeniga on probleeme, eemaldame selle
      localStorage.removeItem('token');
      return null;
    }
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default authService;