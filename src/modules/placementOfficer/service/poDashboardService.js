import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

const buildUrl = (endpointOrUrl) => {
  if (!endpointOrUrl) return "";

  if (
    endpointOrUrl.startsWith("http://") ||
    endpointOrUrl.startsWith("https://")
  ) {
    return endpointOrUrl;
  }

  return `${API_BASE}${endpointOrUrl}`;
};

export const poDashboardService = {
  async getDashboardKpis() {
    const response = await axios.get(
      buildUrl("interviews/placement-officer/dashboard-kpis"),
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  },

  async getPlacementReadyStudents(url = null) {
    const response = await axios.get(
      url || buildUrl("interviews/placement-officer/placement-ready-students"),
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  },

  async getStudentsNeedingAttention(url = null) {
    const response = await axios.get(
      url || buildUrl("interviews/placement-officer/students-needing-attention"),
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  },
};