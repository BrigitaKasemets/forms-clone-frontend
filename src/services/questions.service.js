import api from '../utils/axiosConfig';

const QuestionsService = {
  /**
   * Kõikide küsimuste hankimine vormist
   * @param {string} formId - Vormi ID
   * @returns {Promise<Array>} - Küsimuste massiiv
   */
  getQuestions: async (formId) => {
    try {
      const response = await api.get(`/forms/${formId}/questions`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get questions' };
    }
  },

  /**
   * Konkreetse küsimuse hankimine ID järgi
   * @param {string} formId - Vormi ID
   * @param {string} questionId - Küsimuse ID
   * @returns {Promise<Object>} - Küsimuse andmed
   */
  getQuestionById: async (formId, questionId) => {
    try {
      const response = await api.get(`/forms/${formId}/questions/${questionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to get question' };
    }
  },

  /**
   * Uue küsimuse loomine vormi
   * @param {string} formId - Vormi ID
   * @param {Object} questionData - Küsimuse andmed (text, type, options)
   * @returns {Promise<Object>} - Loodud küsimus
   */
  createQuestion: async (formId, questionData) => {
    try {
      const response = await api.post(`/forms/${formId}/questions`, questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create question' };
    }
  },

  /**
   * Olemasoleva küsimuse uuendamine
   * @param {string} formId - Vormi ID
   * @param {string} questionId - Küsimuse ID
   * @param {Object} questionData - Uuendatud küsimuse andmed
   * @returns {Promise<Object>} - Uuendatud küsimus
   */
  updateQuestion: async (formId, questionId, questionData) => {
    try {
      const response = await api.patch(`/forms/${formId}/questions/${questionId}`, questionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update question' };
    }
  },

  /**
   * Küsimuse kustutamine
   * @param {string} formId - Vormi ID
   * @param {string} questionId - Küsimuse ID
   * @returns {Promise<void>}
   */
  deleteQuestion: async (formId, questionId) => {
    try {
      await api.delete(`/forms/${formId}/questions/${questionId}`);
    } catch (error) {
      throw error.response?.data || { error: 'Failed to delete question' };
    }
  }
};

export default QuestionsService;