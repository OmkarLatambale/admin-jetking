import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const placementOfficerService = {
  async getCenters() {
    const response = await axios.get(`${API_BASE}interviews/centers-list`, {
      headers: getAuthHeaders(),
    });

    return response.data;
  },

  async createPlacementOfficer(payload) {
    const response = await axios.post(
      `${API_BASE}tpo/create-placement-officer`,
      payload,
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  },

  async getPlacementOfficers() {
  const response = await axios.get(`${API_BASE}tpo/list-placement-officer`, {
    headers: getAuthHeaders(),
  });

  return response.data;
},


};