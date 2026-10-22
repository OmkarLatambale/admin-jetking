import { useState } from "react";
import { loginService, logoutService } from "./authService";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password, role = "tpo") => {
    setLoading(true);
    setError(null);

    const result = await loginService({ email, password, role });

    setLoading(false);

    if (result.status === "error") {
      setError(result.data);
    }

    return result;
  };

  const logout = () => {
    logoutService();
  };

  return { login, logout, loading, error };
};