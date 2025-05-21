import api from '../utils/axiosConfig';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/sessions', { email, password });
      console.log("Auth service login response:", response.data);
      
      // Salvestame tokeni localStorage'isse, et seda oleks võimalik hiljem kasutada
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        // Save user data if available
        if (response.data.user) {
          console.log('Saving user data to localStorage:', response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else if (response.data.userId) {
          // If user data is not included but we have userId, fetch user data using the correct endpoint
          try {
            const userId = response.data.userId;
            console.log(`Fetching user data for userId: ${userId}`);

            const userResponse = await api.get(`/users/${userId}`);
            console.log('Fetched user data after login:', userResponse.data);
            if (userResponse.data) {
              localStorage.setItem('user', JSON.stringify(userResponse.data));
            }
          } catch (userErr) {
            console.error('Could not fetch user data after login:', userErr);
          }
        }
        
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
  
  register: async (email, password, name) => {
    try {
      const response = await api.post('/users', { email, password, name });
      console.log("Registration response:", response.data);

      // Kui serverist tuleb tagasi token, siis salvestame selle ja kasutajaandmed
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);

        // Salvestame ka kasutaja andmed kui need on saadaval
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
      }

      return response.data;
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = 'Registreerimine ebaõnnestus. Palun proovige uuesti.';

      if (error.response) {
        // Handle different error types
        const status = error.response.status;
        const data = error.response.data;

        if (status === 409) {
          errorMessage = 'See e-posti aadress on juba kasutuses.';
        } else if (status === 400 && data.message) {
          errorMessage = data.message;
        } else {
          errorMessage = data?.message || data?.error || `Registreerimine ebaõnnestus: ${status}`;
        }
      }

      throw new Error(errorMessage);
    }
  },

  logout: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log("User logged out, cleared localStorage");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  },

  getCurrentUser: () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        token,
        isLoggedIn: true,
        user
      };
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
};

export default authService;

