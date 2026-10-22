import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}student/login`;

export const loginService = async ({ email, password, role }) => {
  try {
    const response = await axios.post(API_URL, {
      email,
      password,
      role,
    });

    const payload = response.data?.data;

    if (payload) {
      const { access, refresh, user } = payload;

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      const normalizedUser = {
        ...user,
        role, // frontend will always use only "tpo" or "trainer"
      };

      localStorage.setItem("user", JSON.stringify(normalizedUser));

      return { status: "success", data: normalizedUser };
    }

    return { status: "error", data: "Invalid response from server" };
  } catch (error) {
    const backendError =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "Login failed. Please try again.";

    return { status: "error", data: backendError };
  }
};

export const logoutService = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};