import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const trainerService = {
  async getCenters() {
    const response = await axios.get(`${API_BASE}interviews/centers-list`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async createTrainer(payload) {
    const response = await axios.post(
      `${API_BASE}tpo/create-trainer`,
      payload,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async getTrainers() {
    const response = await axios.get(`${API_BASE}interviews/trainers-list`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};