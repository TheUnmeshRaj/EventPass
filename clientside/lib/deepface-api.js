import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_DEEPFACE_API_URL || 'http://localhost:8000';

export const deepfaceAPI = {
  /**
   * Verify a captured face against the database
   */
  async verifyFace(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, 'face.jpg');

      const response = await axios.post(`${API_BASE_URL}/api/verify-face`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Face verification error:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.message ||
        'Face verification failed'
      );
    }
  },

  /**
   * Register a new user's face
   */
  async registerFace(imageBlob, userId) {
    try {
      const formData = new FormData();
      formData.append('file', imageBlob, `${userId}.jpg`);

      const response = await axios.post(`${API_BASE_URL}/api/register-face`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Face registration error:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.message ||
        'Face registration failed'
      );
    }
  },

  /**
   * Compare two faces
   */
  async compareFaces(imageBlob1, imageBlob2) {
    try {
      const formData = new FormData();
      formData.append('face1', imageBlob1, 'face1.jpg');
      formData.append('face2', imageBlob2, 'face2.jpg');

      const response = await axios.post(`${API_BASE_URL}/api/compare-faces`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      console.error('Face comparison error:', error);
      throw new Error(
        error.response?.data?.detail ||
        error.message ||
        'Face comparison failed'
      );
    }
  },

  /**
   * Health check for the API
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  },
};
