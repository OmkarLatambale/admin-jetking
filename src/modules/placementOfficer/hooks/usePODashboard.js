import { useEffect, useMemo, useState } from "react";
import { poDashboardService } from "../service/poDashboardService";

const initialPagination = {
  next: null,
  previous: null,
};

export const usePODashboard = () => {
  const [kpis, setKpis] = useState(null);

  const [readyStudents, setReadyStudents] = useState([]);
  const [attentionStudents, setAttentionStudents] = useState([]);

  const [readyPagination, setReadyPagination] = useState(initialPagination);
  const [attentionPagination, setAttentionPagination] =
    useState(initialPagination);

  const [loadingKpis, setLoadingKpis] = useState(false);
  const [loadingReadyStudents, setLoadingReadyStudents] = useState(false);
  const [loadingAttentionStudents, setLoadingAttentionStudents] =
    useState(false);

  const [error, setError] = useState("");

  const [readyFilters, setReadyFilters] = useState({
    center: "",
    course: "",
  });

  const [attentionFilters, setAttentionFilters] = useState({
    center: "",
    course: "",
  });

  const normalizePaginatedResponse = (data) => {
    return {
      next: data?.next || null,
      previous: data?.previous || null,
      results: Array.isArray(data?.results) ? data.results : [],
    };
  };

  const loadKpis = async () => {
    try {
      setLoadingKpis(true);
      setError("");

      const data = await poDashboardService.getDashboardKpis();
      setKpis(data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Failed to load placement officer dashboard KPIs."
      );
    } finally {
      setLoadingKpis(false);
    }
  };

  const loadReadyStudents = async (url = null) => {
    try {
      setLoadingReadyStudents(true);
      setError("");

      const data = await poDashboardService.getPlacementReadyStudents(url);
      const normalized = normalizePaginatedResponse(data);

      setReadyStudents(normalized.results);
      setReadyPagination({
        next: normalized.next,
        previous: normalized.previous,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Failed to load placement-ready students."
      );
    } finally {
      setLoadingReadyStudents(false);
    }
  };

  const loadAttentionStudents = async (url = null) => {
    try {
      setLoadingAttentionStudents(true);
      setError("");

      const data = await poDashboardService.getStudentsNeedingAttention(url);
      const normalized = normalizePaginatedResponse(data);

      setAttentionStudents(normalized.results);
      setAttentionPagination({
        next: normalized.next,
        previous: normalized.previous,
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Failed to load students needing attention."
      );
    } finally {
      setLoadingAttentionStudents(false);
    }
  };

  useEffect(() => {
    loadKpis();
    loadReadyStudents();
    loadAttentionStudents();
  }, []);

  const readyFilterOptions = useMemo(() => {
    const centers = [
      ...new Set(
        readyStudents
          .map((student) => student.center)
          .filter(Boolean)
      ),
    ];

    const courses = [
      ...new Set(
        readyStudents
          .map((student) => student.course_name)
          .filter(Boolean)
      ),
    ];

    return { centers, courses };
  }, [readyStudents]);

  const attentionFilterOptions = useMemo(() => {
    const centers = [
      ...new Set(
        attentionStudents
          .map((student) => student.center)
          .filter(Boolean)
      ),
    ];

    const courses = [
      ...new Set(
        attentionStudents
          .map((student) => student.course_name)
          .filter(Boolean)
      ),
    ];

    return { centers, courses };
  }, [attentionStudents]);

  const filteredReadyStudents = useMemo(() => {
    return readyStudents.filter((student) => {
      const matchesCenter =
        !readyFilters.center || student.center === readyFilters.center;

      const matchesCourse =
        !readyFilters.course || student.course_name === readyFilters.course;

      return matchesCenter && matchesCourse;
    });
  }, [readyStudents, readyFilters]);

  const filteredAttentionStudents = useMemo(() => {
    return attentionStudents.filter((student) => {
      const matchesCenter =
        !attentionFilters.center || student.center === attentionFilters.center;

      const matchesCourse =
        !attentionFilters.course ||
        student.course_name === attentionFilters.course;

      return matchesCenter && matchesCourse;
    });
  }, [attentionStudents, attentionFilters]);

  const handleReadyFilterChange = (field, value) => {
    setReadyFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAttentionFilterChange = (field, value) => {
    setAttentionFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetReadyFilters = () => {
    setReadyFilters({
      center: "",
      course: "",
    });
  };

  const resetAttentionFilters = () => {
    setAttentionFilters({
      center: "",
      course: "",
    });
  };

  const handleReadyNext = () => {
    if (readyPagination.next && !loadingReadyStudents) {
      loadReadyStudents(readyPagination.next);
    }
  };

  const handleReadyPrevious = () => {
    if (readyPagination.previous && !loadingReadyStudents) {
      loadReadyStudents(readyPagination.previous);
    }
  };

  const handleAttentionNext = () => {
    if (attentionPagination.next && !loadingAttentionStudents) {
      loadAttentionStudents(attentionPagination.next);
    }
  };

  const handleAttentionPrevious = () => {
    if (attentionPagination.previous && !loadingAttentionStudents) {
      loadAttentionStudents(attentionPagination.previous);
    }
  };

  return {
    kpis,

    readyStudents: filteredReadyStudents,
    attentionStudents: filteredAttentionStudents,

    loadingKpis,
    loadingReadyStudents,
    loadingAttentionStudents,

    error,

    readyPagination,
    attentionPagination,

    readyFilters,
    attentionFilters,

    readyFilterOptions,
    attentionFilterOptions,

    handleReadyFilterChange,
    handleAttentionFilterChange,

    resetReadyFilters,
    resetAttentionFilters,

    handleReadyNext,
    handleReadyPrevious,
    handleAttentionNext,
    handleAttentionPrevious,

    refreshDashboard: () => {
      loadKpis();
      loadReadyStudents();
      loadAttentionStudents();
    },
  };
};