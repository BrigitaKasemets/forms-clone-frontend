import api from '../utils/axiosConfig';

const FormsService = {
  /**
   * Kõikide vormide hankimine
   * @returns {Promise<Array>} Vormide massiiv
   */
  getAllForms: async () => {
    try {
      const response = await api.get('/forms');
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get forms' };
    }
  },

  /**
   * Konkreetse vormi hankimine ID järgi
   * @param {string} formId - Vormi ID
   * @returns {Promise<Object>} - Vormi andmed
   */
  getFormById: async (formId) => {
    try {
      const response = await api.get(`/forms/${formId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get form' };
    }
  },

  /**
   * Uue vormi loomine
   * @param {Object} formData - Vormi andmed (title, description)
   * @returns {Promise<Object>} - Loodud vorm
   */
  createForm: async (formData) => {
    try {
      const formDataToSend = { ...formData };
      
      // Make sure to convert userId to a string for consistent comparison
      if (formDataToSend.userId) {
        formDataToSend.userId = String(formDataToSend.userId);
      }
      
      // If userId wasn't already set in the formData, try to get it from localStorage
      if (!formDataToSend.userId) {
        console.log('No userId provided, trying to get from localStorage');
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            console.log('User data from localStorage:', userData);
            
            // The user could be stored directly or in a nested user property
            if (userData && userData.id) {
              formDataToSend.userId = String(userData.id);
            } else if (userData && userData.user && userData.user.id) {
              formDataToSend.userId = String(userData.user.id);
            }
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
          }
        }
      }
      
      console.log('Creating form with data:', formDataToSend);
      const response = await api.post('/forms', formDataToSend);
      console.log('Form created, API response:', response.data);
      
      // Ensure the created form has the same userId as we sent
      const createdForm = {
        ...response.data
      };
      
      if (formDataToSend.userId && !createdForm.userId) {
        console.log('Adding userId to form because it was missing in the response');
        createdForm.userId = formDataToSend.userId;
      }
      
      return createdForm;
    } catch (error) {
      console.error('Error creating form:', error);
      throw error.response?.data || { error: 'Failed to create form' };
    }
  },

  /**
   * Olemasoleva vormi uuendamine
   * @param {string} formId - Vormi ID
   * @param {Object} formData - Uuendatud vormi andmed (title, description)
   * @returns {Promise<Object>} - Uuendatud vorm
   */
  updateForm: async (formId, formData) => {
    try {
      const response = await api.patch(`/forms/${formId}`, formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update form' };
    }
  },

  /**
   * Vormi kustutamine
   * @param {string} formId - Vormi ID
   * @returns {Promise<void>}
   */
  deleteForm: async (formId) => {
    try {
      await api.delete(`/forms/${formId}`);
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete form' };
    }
  }
};

export default FormsService;