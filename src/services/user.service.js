import api from '../utils/axiosConfig';

// Abifunktsioon kasutaja ID saamiseks localStorage'ist
const getUserId = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user && user.id) {
        console.log('Found user ID in localStorage:', user.id);
        // Make sure we always return a string ID
        return String(user.id);
      }
    }

    // Proovime leida kasutajaandmeid tokenist
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Found token, but no user ID. User data might be accessible with token.');
      return null; // Tagastame null, aga kasutame hiljem token-põhist autentimist
    }

    console.warn('Neither user ID nor token found in localStorage');
    return null;
  } catch (e) {
    console.error('Error getting user ID from localStorage:', e);
    return null;
  }
};

const UserService = {
  /**
   * Get all users
   * @returns {Promise<Array>} Array of users
   */
  getAllUsers: async () => {
    try {
      console.log('Fetching all users from /users');
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized access. Please log in.');
      }
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users. Please try again later.');
    }
  },

  /**
   * Get a specific user by ID
   * @param {string} userId - User ID or 'me' for current user
   * @returns {Promise<Object>} - User data
   */
  getUserById: async (userId) => {
    try {
      // Kui 'me' või mingi muu spetsiaalidentifikaator kasutati,
      // proovime leida tegelikku kasutaja ID localStorage'ist
      let actualUserId = userId;
      let useLocalStorage = false;

      if (userId === 'me' || userId === 'current' || userId === 'profile') {
        actualUserId = getUserId();

        if (!actualUserId) {
          console.log('No user ID found for current user, will use localStorage fallback');
          useLocalStorage = true;
        } else {
          console.log(`Using actual user ID: ${actualUserId} instead of '${userId}'`);
        }
      }

      // Ensure userId is a string
      actualUserId = actualUserId ? String(actualUserId) : actualUserId;

      // Kui leidsime ID, teeme standardse päringu vastavalt openapi.yaml spetsifikatsioonile
      if (!useLocalStorage && actualUserId) {
        const endpoint = `/users/${actualUserId}`;
        console.log(`Fetching user data from endpoint: ${endpoint}`);

        try {
          const response = await api.get(endpoint, {
            headers: {
              'Content-Type': 'application/json'
            }
          });

          console.log('User data response successful:', response.data);

          // Kui see on praegune kasutaja, uuendame localStorage andmeid
          if (userId === 'me' || userId === 'current' || userId === 'profile') {
            try {
              localStorage.setItem('user', JSON.stringify(response.data));
              console.log('Updated user data in localStorage');
            } catch (e) {
              console.error('Error updating user data in localStorage:', e);
            }
          }

          return response.data;
        } catch (error) {
          console.error(`API request to ${endpoint} failed:`, error.message);

          if (userId === 'me' || userId === 'current' || userId === 'profile') {
            useLocalStorage = true; // Kui API päring ebaõnnestub, proovime localStorage'ist
          } else {
            throw error; // Kui tegu pole praeguse kasutajaga, viskame vea edasi
          }
        }
      }

      // Kui jõudsime siia, siis kas ID puudus või API päring ebaõnnestus
      // Ainult praeguse kasutaja puhul proovime kasutada localStorage andmeid
      if (useLocalStorage && (userId === 'me' || userId === 'current' || userId === 'profile')) {
        console.log('Attempting to get user data from localStorage');

        try {
          const localUser = JSON.parse(localStorage.getItem('user'));
          if (localUser) {
            console.log('Using cached user data from localStorage:', localUser);
            return localUser;
          } else {
            console.warn('No user data found in localStorage');
          }

          // Kui localStorage'is pole kasutajaandmeid, aga on token,
          // tagastame minimaalsed andmed, et UI saaks näidata kasutaja sessiooni
          const token = localStorage.getItem('token');
          if (token) {
            console.log('Creating minimal user object from token');
            return {
              name: "Kasutaja",
              email: "Andmed pole saadaval"
            };
          }

          throw new Error('Kasutaja andmeid ei leitud. Palun logige uuesti sisse.');
        } catch (e) {
          console.error('Error reading localStorage:', e);
          throw new Error('Kasutaja andmete laadimine kohalikust salvestusest ebaõnnestus.');
        }
      }

      throw new Error('Kasutaja andmete laadimine ebaõnnestus.');
    } catch (error) {
      console.error('Get user error:', error);

      if (error.response) {
        const errorMessage = error.response.data?.message ||
                          error.response.data?.error ||
                          `Failed to get user: ${error.response.status}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User data (email, password, name)
   * @returns {Promise<Object>} - Created user
   */
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Validation failed. Please check your input.');
      } else if (error.response?.status === 409) {
        throw new Error('Email already exists. Please use a different email.');
      }
      console.error('Error creating user:', error);
      throw new Error('Failed to create user. Please try again later.');
    }
  },

  // Update an existing user
  updateUser: async (userId, userData) => {
    try {
      console.log(`Attempting to update user ${userId} with data:`, userData);

      // Kui 'me' kasutati, proovime leida tegelikku ID-d
      let actualUserId = userId === 'me' ? getUserId() : userId;
      if (!actualUserId) {
        throw new Error('User ID not found. Please log in again.');
      }

      // Ensure userId is always a string
      actualUserId = String(actualUserId);
      
      const endpoint = `/users/${actualUserId}`;
      console.log(`Sending PATCH request to ${endpoint} with data:`, userData);

      const response = await api.patch(endpoint, userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Update user response:', response.data);

      // Uuendame localStorage'i kui see on praegune kasutaja
      if (userId === 'me') {
        try {
          const updatedUser = {
            ...JSON.parse(localStorage.getItem('user') || '{}'),
            ...response.data
          };
          console.log('Updating localStorage with user data:', updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (e) {
          console.error('Error updating local storage:', e);
        }
      }

      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Invalid input. Please check your data.');
      } else if (error.response?.status === 404) {
        throw new Error('User not found.');
      }
      console.error('Error updating user:', error);
      throw new Error('Failed to update user. Please try again later.');
    }
  },

  /**
   * Delete a user
   * @param {string} userId - User ID or 'me' for current user
   * @returns {Promise<void>}
   */
  deleteUser: async (userId) => {
    try {
      // Kui 'me' kasutati, proovime leida tegelikku ID-d
      let actualUserId = userId;
      if (userId === 'me') {
        actualUserId = getUserId();
        if (!actualUserId) {
          throw new Error('Kasutaja ID-d ei leitud. Palun logige uuesti sisse.');
        }
        console.log(`Using actual user ID: ${actualUserId} instead of 'me'`);
      }

      // Ensure userId is always a string
      actualUserId = String(actualUserId);

      const endpoint = `/users/${actualUserId}`;
      console.log(`Sending DELETE request to ${endpoint}`);

      const response = await api.delete(endpoint);
      console.log('Delete user response:', response.status);

      // Kustutame localStorage'ist kasutajaandmed
      if (userId === 'me') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.log('User data and token cleared from localStorage');
      }

      return true;
    } catch (error) {
      console.error('Delete user error details:', error);

      if (error.response) {
        const errorMessage = error.response.data?.message ||
                        error.response.data?.error ||
                        `Konto kustutamine ebaõnnestus: ${error.response.status}`;
        throw new Error(errorMessage);
      }
      throw new Error('Konto kustutamine ebaõnnestus. Palun proovige hiljem uuesti.');
    }
  },

  /**
   * Change user password
   * @param {string} userId - User ID or 'me' for current user
   * @param {Object} passwordData - Password data (currentPassword, newPassword)
   * @returns {Promise<Object>} - Response message
   */
  changePassword: async (userId, passwordData) => {
    try {
      // Kui 'me' kasutati, proovime leida tegelikku ID-d
      let actualUserId = userId;
      if (userId === 'me') {
        actualUserId = getUserId();
        if (!actualUserId) {
          throw new Error('Kasutaja ID-d ei leitud. Palun logige uuesti sisse.');
        }
        console.log(`Using actual user ID: ${actualUserId} instead of 'me'`);
      }

      // Ensure userId is always a string
      actualUserId = String(actualUserId);

      console.log("Attempting direct password change via backend API...");
      console.log("New password length:", passwordData.newPassword?.length);

      // Kasutame PUT päringu meetodit parooli vahetamiseks (võib-olla server nõuab seda)
      const endpoint = `/users/${actualUserId}`;
      
      // Proovime erinevaid lähenemisviise, alustame lihtsalt parooli saatmisest
      const simpleData = {
        password: passwordData.newPassword
      };
      
      console.log(`Sending PUT request to ${endpoint}:`, JSON.stringify(simpleData));
      
      // Proovime kasutada PUT meetodit
      try {
        const response = await api.put(endpoint, simpleData);
        console.log('Password change PUT response:', response.status, response.data);
      } catch (putError) {
        console.log('PUT request failed, attempting PATCH instead:', putError.message);
        // Jätkame PATCH meetodiga, kui PUT ei õnnestunud
      }
      
      // Katsume erinevat andmestruktuuri
      const complexData = {
        password: passwordData.newPassword,
        currentPassword: passwordData.currentPassword,
        password_old: passwordData.currentPassword,
        password_new: passwordData.newPassword
      };
      
      console.log(`Sending PATCH request to ${endpoint}:`, JSON.stringify(complexData));
      const response = await api.patch(endpoint, complexData);
      
      console.log('Password change response status:', response.status);
      console.log('Response data:', response.data);
      
      // Pärast edukat vastust kustutame tokeni, et sundida uuesti sisselogimist
      localStorage.removeItem('token');
      
      return {
        success: true,
        data: response.data,
        message: 'Parool muudetud. Palun logige uuesti sisse uue parooliga.'
      };
    } catch (error) {
      console.error('Change password error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Liigitame vead nende tüübi järgi
      const errorType = 
        !error.response ? 'network' :
        error.response.status === 401 || error.response.status === 403 ? 'auth' :
        error.response.status === 400 ? 'validation' :
        'server';
      
      console.log('Error type categorized as:', errorType);

      if (error.response) {
        // Add more descriptive messages for specific error codes
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error('Praegune parool on vale. Palun proovige uuesti.');
        } else if (error.response.status === 400) {
          // Loeme täpsemalt veaväljad välja
          const errorData = error.response.data;
          console.log('Error data from 400 response:', errorData);
          
          if (errorData?.error?.includes('password') || 
              errorData?.message?.includes('password') ||
              errorData?.error?.includes('parool') || 
              errorData?.message?.includes('parool')) {
            throw new Error('Uus parool ei vasta nõuetele. Parool peab olema vähemalt 8 tähemärki pikk.');
          } else {
            throw new Error('Uus parool ei vasta nõuetele. Palun kontrollige sisestatud parooli.');
          }
        }
        
        const errorMessage = error.response.data?.message ||
                         error.response.data?.error ||
                         `Parooli muutmine ebaõnnestus: ${error.response.status}`;
        throw new Error(errorMessage);
      }
      
      // Võrguvigade puhul anname spetsiifilisema sõnumi
      if (error.code === 'ECONNABORTED') {
        throw new Error('Parooli muutmise päring aegus. Palun kontrollige oma internetiühendust ja proovige uuesti.');
      } else if (error.message && error.message.includes('Network Error')) {
        throw new Error('Võrguühenduse probleem. Palun kontrollige oma internetiühendust ja proovige uuesti.');
      }
      
      throw new Error('Parooli muutmine ebaõnnestus. Palun proovige hiljem uuesti.');
    }
  }
};

export default UserService;
