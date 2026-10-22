import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizePaginationUrl = (url) => {
  if (!url) return null;

  try {
    const apiBase = new URL(API_URL);
    const resolved = new URL(url, API_URL);
    return new URL(
      `${resolved.pathname}${resolved.search}`,
      `${apiBase.origin}`,
    ).toString();
  } catch {
    return url;
  }
};

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const loadReports = async (url = `${API_URL}interviews/reports`) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(url, { headers: getAuthHeaders() });

      // console.log("API Response:", response.data); // Debug log

      // Handle pagination structure from DRF
      if (response.data.results) {
        setReports(response.data.results);
        setNextUrl(normalizePaginationUrl(response.data.next));
        setPrevUrl(normalizePaginationUrl(response.data.previous));
      } else {
        // fallback if backend not paginated
        setReports(Array.isArray(response.data) ? response.data : []);
        setNextUrl(null);
        setPrevUrl(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reports");
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  return { reports, loading, error, loadReports, nextUrl, prevUrl };
};

export const useReportDetail = (id) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}interviews/reports/${id}`, {
          headers: getAuthHeaders(),
        });
        setReport(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch report detail");
        console.error("Error fetching report detail:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetail();
  }, [id]);

  return { report, loading, error };
};
