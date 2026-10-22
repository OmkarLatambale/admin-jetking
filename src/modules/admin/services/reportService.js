import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchReports = async () => {
  try {
    const response = await axios.get(`${API_URL}interviews/reports`, {
      headers: getAuthHeaders(),
    });
    return { status: "success", data: response.data };
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to fetch performance reports.";
    return { status: "error", data: message };
  }
};

export const fetchReportById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}interviews/reports/${id}`, {
      headers: getAuthHeaders(),
    });
    return { status: "success", data: response.data };
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to fetch report details.";
    return { status: "error", data: message };
  }
}
