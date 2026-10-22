import { useEffect, useState } from "react";
import { fetchAnalytics } from "../services/analyticsService";

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      const res = await fetchAnalytics();

      if (res.status === "success") {
        setAnalytics(res.data);
        setError(null);
      } else {
        setError(res.data);
      }

      setLoading(false);
    };

    loadAnalytics();
  }, []);

  return { analytics, loading, error };
};
