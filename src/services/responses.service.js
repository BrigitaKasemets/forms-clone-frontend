import api from '../utils/axiosConfig';

const ResponsesService = {
  /**
   * Kõikide vastuste hankimine vormist
   * @param {string} formId - Vormi ID
   * @returns {Promise<Array>} - Vastuste massiiv
   */
  getResponses: async (formId) => {
    try {
      const response = await api.get(`/forms/${formId}/responses`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get responses' };
    }
  },

  /**
   * Konkreetse vastuse hankimine ID järgi
   * @param {string} formId - Vormi ID
   * @param {string} responseId - Vastuse ID
   * @returns {Promise<Object>} - Vastuse andmed
   */
  getResponseById: async (formId, responseId) => {
    try {
      const response = await api.get(`/forms/${formId}/responses/${responseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get response' };
    }
  },

  /**
   * Uue vastuse loomine vormi
   * @param {string} formId - Vormi ID
   * @param {Object} responseData - Vastuse andmed (answers, respondentName, respondentEmail)
   * @returns {Promise<Object>} - Loodud vastus
   */
  createResponse: async (formId, responseData) => {
    try {
      const response = await api.post(`/forms/${formId}/responses`, responseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create response' };
    }
  },

  /**
   * Olemasoleva vastuse uuendamine
   * @param {string} formId - Vormi ID
   * @param {string} responseId - Vastuse ID
   * @param {Object} responseData - Uuendatud vastuse andmed
   * @returns {Promise<Object>} - Uuendatud vastus
   */
  updateResponse: async (formId, responseId, responseData) => {
    try {
      const response = await api.patch(`/forms/${formId}/responses/${responseId}`, responseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update response' };
    }
  },

  /**
   * Vastuse kustutamine
   * @param {string} formId - Vormi ID
   * @param {string} responseId - Vastuse ID
   * @returns {Promise<void>}
   */
  deleteResponse: async (formId, responseId) => {
    try {
      await api.delete(`/forms/${formId}/responses/${responseId}`);
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete response' };
    }
  }
};

export default ResponsesService;