import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const addCenterService = {
  async createCenter(payload) {
    const response = await axios.post(`${API_BASE}tpo/create-center`, payload, {
      headers: getAuthHeaders(),
    });

    return response.data;
  },
};