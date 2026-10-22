import React from "react";
import { fetchInterviewTableData } from "../services/analyticsService"; 

export const useInterviewTable = (centerId = "") => {
  const [interviewTable, setInterviewTable] = React.useState([]);
  const [interviewRatings, setInterviewRatings] = React.useState([]);
  const [visualFeedback, setVisualFeedback] = React.useState([]);
  const [pagination, setPagination] = React.useState({ next: null, previous: null });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const buildRequestUrl = React.useCallback(
    (url = null) => {
      const baseUrl =
        url || `${import.meta.env.VITE_API_URL}interviews/interview-table-data`;
      const parsedUrl = new URL(baseUrl, window.location.origin);

      if (centerId) {
        parsedUrl.searchParams.set("center_id", centerId);
      } else {
        parsedUrl.searchParams.delete("center_id");
      }

      return parsedUrl.toString();
    },
    [centerId]
  );

  const loadPage = React.useCallback(async (url = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const resp = await fetchInterviewTableData(buildRequestUrl(url));
      if (resp?.status !== "success") {
        throw new Error(resp?.data || "Failed to load interview table data");
      }

      const data = resp.data;         
      const results = data.results ?? {};
      setInterviewTable(results.interview_table ?? []);
      setInterviewRatings(results.interview_ratings ?? []);
      setVisualFeedback(results.visual_feedback ?? []);
      setPagination({ next: data.next ?? null, previous: data.previous ?? null });
    } catch (e) {
      setError(e.message || "Something went wrong while loading data");
    } finally {
      setLoading(false);
    }
  }, [buildRequestUrl]);

  const loadNext = React.useCallback(() => {
    if (pagination.next) {
      loadPage(pagination.next);
    }
  }, [pagination.next, loadPage]);

  const loadPrevious = React.useCallback(() => {
    if (pagination.previous) {
      loadPage(pagination.previous);
    }
  }, [pagination.previous, loadPage]);

  React.useEffect(() => {
    loadPage();
  }, [loadPage]);

  return {
    interviewTable,
    interviewRatings,
    visualFeedback,
    pagination,
    loading,
    error,
    loadNext,
    loadPrevious,
  };
};
