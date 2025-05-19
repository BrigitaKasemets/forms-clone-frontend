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
      const response = await api.post('/forms', formData);
      return response.data;
    } catch (error) {
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