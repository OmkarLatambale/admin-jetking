import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSearch,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import {
  fetchJobDescriptionDetail,
  fetchJdDocumentBlob,
  fetchJobDescriptions,
  scheduleInterviewWithJd,
} from "../services/jdRepositoryService";

const API_BASE = import.meta.env.VITE_API_URL;
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

const stepConfig = [
  { key: "jd", label: "Select JD" },
  { key: "candidates", label: "Assign Candidates" },
  { key: "review", label: "Review & Confirm" },
];

const jdDifficultyOptions = [
  { value: "", label: "All difficulty" },
  { value: "simple", label: "Simple" },
  { value: "medium", label: "Medium" },
  { value: "complex", label: "Complex" },
];

const interviewDifficultyOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "medium", label: "Medium" },
  { value: "advanced", label: "Advanced" },
];

const mapJdDifficultyToInterviewDifficulty = (difficulty) => {
  if (difficulty === "complex") return "advanced";
  if (difficulty === "medium") return "medium";
  return "beginner";
};

const formatPackage = (jd) => {
  if (!jd || jd.category === "conceptual" || jd.package_lpa === null) {
    return "N/A";
  }

  return `${jd.package_lpa} LPA`;
};

const formatScore = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "N/A";
  }

  return Math.round(Number(value));
};

const toLocalInputValue = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

const fetchInterviewCandidates = async (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  const response = await fetch(
    `${API_BASE}interviews/scheduling/students${query ? `?${query}` : ""}`,
    { headers: getAuthHeaders() }
  );

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error || payload?.detail || "Failed to load candidates.";
    throw new Error(message);
  }

  return payload;
};

const Toast = ({ toast }) =>
  toast.show ? (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`px-6 py-3 rounded-lg shadow-lg ${
          toast.type === "success" ? "bg-[#415bbc] text-white" : "bg-[#7A1C1C] text-white"
        }`}
      >
        {toast.message}
      </div>
    </div>
  ) : null;

const ScheduleInterview = () => {
  const [step, setStep] = useState("jd");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [selectedJd, setSelectedJd] = useState(null);
  const [isLoadingJdDetail, setIsLoadingJdDetail] = useState(false);
  const [isOpeningDocument, setIsOpeningDocument] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [minDateTime, setMinDateTime] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [interviewDifficulty, setInterviewDifficulty] = useState("beginner");
  const [jdFilters, setJdFilters] = useState({
    search: "",
    difficulty: "",
    page: 1,
  });
  const [candidateFilters, setCandidateFilters] = useState({
    batch_no: "",
    course: "",
    search: "",
    page: 1,
  });
  const [jdSearch, setJdSearch] = useState("");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [jdData, setJdData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [candidateData, setCandidateData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [candidateFilterOptions, setCandidateFilterOptions] = useState({
    batches: [],
    courses: [],
  });
  const [isLoadingJds, setIsLoadingJds] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    window.setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    const updateMin = () => {
      const nextMin = toLocalInputValue(new Date());
      setMinDateTime(nextMin);
      setScheduledTime((current) => current || nextMin);
    };

    updateMin();
    const timer = window.setInterval(updateMin, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setJdFilters((prev) => ({ ...prev, search: jdSearch.trim(), page: 1 }));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [jdSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCandidateFilters((prev) => ({ ...prev, search: candidateSearch.trim(), page: 1 }));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [candidateSearch]);

  useEffect(() => {
    const loadJds = async () => {
      setIsLoadingJds(true);
      try {
        const data = await fetchJobDescriptions({
          search: jdFilters.search,
          difficulty: jdFilters.difficulty,
          page: jdFilters.page,
          page_size: 8,
          status: currentUser.role === "academic_head" ? "" : "published",
        });
        setJdData(data);
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setIsLoadingJds(false);
      }
    };

    if (step === "jd") {
      loadJds();
    }
  }, [jdFilters, step]);

  useEffect(() => {
    const loadCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        const data = await fetchInterviewCandidates({
          batch_no: candidateFilters.batch_no,
          course: candidateFilters.course,
          search: candidateFilters.search,
          page: candidateFilters.page,
          page_size: 10,
        });
        setCandidateData(data);
      } catch (error) {
        showToast(error.message, "error");
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    if (step === "candidates" && selectedJd) {
      loadCandidates();
    }
  }, [candidateFilters, step, selectedJd]);

  useEffect(() => {
    let isActive = true;

    const loadCandidateFilterOptions = async () => {
      try {
        const students = [];
        let page = 1;
        let hasNext = true;

        while (hasNext) {
          const data = await fetchInterviewCandidates({
            page,
            page_size: 100,
          });

          students.push(...(data.results || []));
          hasNext = Boolean(data.next);
          page += 1;
        }

        if (!isActive) return;

        const batches = [...new Set(students.map((student) => student.batch_no).filter(Boolean))]
          .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
        const courses = [...new Set(students.map((student) => student.course).filter(Boolean))]
          .sort((a, b) => String(a).localeCompare(String(b)));

        setCandidateFilterOptions({ batches, courses });
      } catch (error) {
        if (isActive) {
          showToast(error.message, "error");
        }
      }
    };

    if (step === "candidates" && selectedJd) {
      loadCandidateFilterOptions();
    }

    return () => {
      isActive = false;
    };
  }, [step, selectedJd]);

  const batchOptions = useMemo(() => {
    const options = new Set(candidateFilterOptions.batches);
    if (candidateFilters.batch_no) {
      options.add(candidateFilters.batch_no);
    }
    return [...options].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }, [candidateFilterOptions.batches, candidateFilters.batch_no]);

  const courseOptions = useMemo(() => {
    const options = new Set(candidateFilterOptions.courses);
    if (candidateFilters.course) {
      options.add(candidateFilters.course);
    }
    return [...options].sort((a, b) => String(a).localeCompare(String(b)));
  }, [candidateFilterOptions.courses, candidateFilters.course]);

  const selectedStudentList = useMemo(() => Object.values(selectedStudents), [selectedStudents]);

  const visibleCandidates = useMemo(() => {
    const selectedIds = new Set(selectedStudentList.map((student) => student.student_id));
    const pinnedSelected = selectedStudentList.filter(
      (student) =>
        !candidateFilters.search ||
        student.name?.toLowerCase().includes(candidateFilters.search.toLowerCase()) ||
        student.email?.toLowerCase().includes(candidateFilters.search.toLowerCase()) ||
        String(student.roll_no).includes(candidateFilters.search)
    );
    const remainingResults = candidateData.results.filter(
      (student) => !selectedIds.has(student.student_id)
    );

    return [...pinnedSelected, ...remainingResults];
  }, [candidateData.results, candidateFilters.search, selectedStudentList]);

  const currentPageSelectedCount = useMemo(() => {
    return candidateData.results.filter((student) => selectedStudents[student.student_id]).length;
  }, [candidateData.results, selectedStudents]);

  const currentPageHasStudents =
    candidateData.results.length > 0 && currentPageSelectedCount === candidateData.results.length;

  const jdTotalPages = Math.max(1, Math.ceil((jdData.count || 0) / 8));
  const handleSelectJd = async (jd) => {
    setIsLoadingJdDetail(true);
    try {
      const detail = await fetchJobDescriptionDetail(jd.id);
      setSelectedJd(detail);
      setInterviewDifficulty(mapJdDifficultyToInterviewDifficulty(detail.difficulty_level));
      setSelectedStudents({});
      setCandidateFilters({
        batch_no: "",
        course: "",
        search: "",
        page: 1,
      });
      setCandidateSearch("");
      setStep("candidates");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsLoadingJdDetail(false);
    }
  };

  const handleOpenDocument = async (jd) => {
    if (!jd?.document_url) return;

    setIsOpeningDocument(true);
    try {
      const blob = await fetchJdDocumentBlob(jd.document_url);
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsOpeningDocument(false);
    }
  };

  const toggleStudent = (student) => {
    setSelectedStudents((prev) => {
      const next = { ...prev };

      if (next[student.student_id]) {
        delete next[student.student_id];
      } else {
        next[student.student_id] = student;
      }

      return next;
    });
  };

  const toggleSelectAllCurrentPage = () => {
    setSelectedStudents((prev) => {
      const next = { ...prev };

      if (currentPageHasStudents) {
        candidateData.results.forEach((student) => {
          delete next[student.student_id];
        });
      } else {
        candidateData.results.forEach((student) => {
          next[student.student_id] = student;
        });
      }

      return next;
    });
  };

  const handleContinueToReview = () => {
    if (selectedStudentList.length === 0) {
      showToast("Select at least one student.", "error");
      return;
    }

    setStep("review");
  };

  const handleSchedule = async () => {
    if (!selectedJd) {
      showToast("Select a JD first.", "error");
      return;
    }

    if (selectedStudentList.length === 0) {
      showToast("Select at least one student.", "error");
      return;
    }

    if (!scheduledTime) {
      showToast("Select a schedule window.", "error");
      return;
    }

    const scheduledTimestamp = new Date(scheduledTime).getTime();
    if (!Number.isFinite(scheduledTimestamp) || scheduledTimestamp < Date.now()) {
      showToast("Schedule window cannot be in the past.", "error");
      return;
    }

    setIsScheduling(true);
    try {
      const response = await scheduleInterviewWithJd({
        job_description_id: selectedJd.id,
        student_ids: selectedStudentList.map((student) => student.student_id),
        difficulty_level: interviewDifficulty,
        scheduled_time: new Date(scheduledTime).toISOString(),
        duration_minutes: 30,
      });

      showToast(response.message || "Interview scheduled successfully.");
      setStep("jd");
      setSelectedJd(null);
      setSelectedStudents({});
      setCandidateData({ count: 0, next: null, previous: null, results: [] });
      setScheduledTime(minDateTime || toLocalInputValue(new Date()));
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
      <Toast toast={toast} />

      <div className="flex-1 p-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#f5f1ff]">
              {step === "jd" ? "JD Repository" : step === "candidates" ? "Assign Candidates" : "Review & Confirm"}
            </h1>
            <p className="mt-2 text-sm text-[#b9b0d2]">
              {step === "jd" && "Select a published job description to begin configuring the interview."}
              {step === "candidates" && "Choose one or multiple students for the selected job description."}
              {step === "review" && "Verify the schedule details before creating the interview assignments."}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-[#3b3052] bg-[#191427]/80 px-3 py-2">
            {stepConfig.map((item, index) => {
              const isActive = item.key === step;
              const isDone = stepConfig.findIndex((entry) => entry.key === step) > index;

              return (
                <div key={item.key} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                      isActive
                        ? "bg-[#8d73ea] text-white"
                        : isDone
                          ? "bg-[#2d7d57] text-white"
                          : "bg-[#2a2140] text-[#b9b0d2]"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className={`text-sm ${isActive ? "text-[#f5f1ff]" : "text-[#9487b8]"}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {step === "jd" && (
          <section className="rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <label className="relative min-w-[280px] flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9487b8]" />
                <input
                  type="text"
                  value={jdSearch}
                  onChange={(event) => setJdSearch(event.target.value)}
                  placeholder="Search JD name or JD text"
                  className="w-full rounded-xl border border-[#483b63] bg-[#191427] py-3 pl-11 pr-4 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                />
              </label>

              <select
                value={jdFilters.difficulty}
                onChange={(event) =>
                  setJdFilters((prev) => ({ ...prev, difficulty: event.target.value, page: 1 }))
                }
                className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
              >
                {jdDifficultyOptions.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

              <div className="overflow-hidden rounded-2xl border border-[#2b2240]">
                <div className="grid grid-cols-[2.1fr_1fr_1fr_1.1fr_1.4fr] gap-4 bg-[#221a34] px-5 py-4 text-xs uppercase tracking-[0.14em] text-[#9487b8]">
                  <span>JD Name</span>
                  <span>Difficulty</span>
                  <span>Category</span>
                  <span>Package</span>
                  <span className="text-right">Action</span>
                </div>

              {isLoadingJds ? (
                <div className="flex items-center justify-center gap-3 bg-[#191427] px-5 py-10 text-[#cebaff]">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Loading job descriptions...
                </div>
              ) : jdData.results.length === 0 ? (
                <div className="bg-[#191427] px-5 py-10 text-center text-[#9487b8]">
                  No published job descriptions found.
                </div>
              ) : (
                jdData.results.map((jd) => (
                  <div
                    key={jd.id}
                    className="grid grid-cols-[2.1fr_1fr_1fr_1.1fr_1.4fr] gap-4 border-t border-[#2b2240] bg-[#191427] px-5 py-4 text-sm text-[#d9d1ef]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#f5f1ff]">{jd.title || "Untitled JD"}</p>
                      <p className="mt-1 truncate text-xs text-[#9487b8]">{jd.original_filename}</p>
                    </div>
                    <div>
                      <span className="rounded-full bg-[#124a69] px-2.5 py-1 text-xs font-medium text-[#84e4ff]">
                        {jd.difficulty_level || "N/A"}
                      </span>
                    </div>
                    <span className="capitalize">{jd.category || "N/A"}</span>
                    <span>{formatPackage(jd)}</span>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument(jd)}
                        className="rounded-lg border border-[#483b63] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#f5f1ff] transition hover:border-[#b89cff]"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectJd(jd)}
                        disabled={isLoadingJdDetail}
                        className="rounded-lg bg-[#8d73ea] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#a88fff] disabled:cursor-not-allowed disabled:bg-[#4a3c69]"
                      >
                        {isLoadingJdDetail && selectedJd?.id === jd.id ? "Loading..." : "Select"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setJdFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={!jdData.previous}
                className="rounded-xl border border-[#483b63] px-4 py-2 text-sm text-[#f5f1ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[#b9b0d2]">
                Page {jdFilters.page} of {jdTotalPages}
              </span>
              <button
                type="button"
                onClick={() => setJdFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={!jdData.next}
                className="rounded-xl border border-[#483b63] px-4 py-2 text-sm text-[#f5f1ff] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>
        )}

        {step === "candidates" && selectedJd && (
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-5 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
              <button
                type="button"
                onClick={() => setStep("jd")}
                className="mb-4 inline-flex items-center gap-2 text-sm text-[#b9b0d2] transition hover:text-[#f5f1ff]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Job Descriptions
              </button>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-[#f5f1ff]">{selectedJd.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#b9b0d2]">
                    <span>{selectedJd.original_filename}</span>
                    <span>•</span>
                    <span className="rounded-full bg-[#124a69] px-2.5 py-1 text-xs font-medium text-[#84e4ff]">
                      {selectedJd.difficulty_level || "N/A"}
                    </span>
                    <span>•</span>
                    <span>{formatPackage(selectedJd)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenDocument(selectedJd)}
                    disabled={isOpeningDocument}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#483b63] px-4 py-2 text-sm text-[#f5f1ff] transition hover:border-[#b89cff]"
                  >
                    <Eye className="h-4 w-4" />
                    {isOpeningDocument ? "Opening..." : "View Document"}
                  </button>
                  <button
                    type="button"
                    onClick={handleContinueToReview}
                    className="rounded-xl bg-[#8d73ea] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a88fff]"
                  >
                    Assign Selected ({selectedStudentList.length})
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr_1.8fr]">
                <select
                  value={candidateFilters.batch_no}
                  onChange={(event) =>
                    setCandidateFilters((prev) => ({
                      ...prev,
                      batch_no: event.target.value,
                      page: 1,
                    }))
                  }
                  className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                >
                  <option value="">All batches</option>
                  {batchOptions.map((batch) => (
                    <option key={batch} value={batch}>
                      {batch}
                    </option>
                  ))}
                </select>

                <select
                  value={candidateFilters.course}
                  onChange={(event) =>
                    setCandidateFilters((prev) => ({
                      ...prev,
                      course: event.target.value,
                      page: 1,
                    }))
                  }
                  className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                >
                  <option value="">All courses</option>
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>
                      {course}
                    </option>
                  ))}
                </select>

                <label
                  className={`relative ${
                    currentUser.role === "academic_head" ? "" : ""
                  }`}
                >
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9487b8]" />
                  <input
                    type="text"
                    value={candidateSearch}
                    onChange={(event) => setCandidateSearch(event.target.value)}
                    placeholder="Search candidate name or ID"
                    className="w-full rounded-xl border border-[#483b63] bg-[#191427] py-3 pl-11 pr-4 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                  />
                </label>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#2b2240]">
                <div className="grid min-w-[980px] grid-cols-[56px_110px_minmax(240px,1.8fr)_140px_110px_160px_130px] items-center gap-4 bg-[#221a34] px-5 py-4 text-xs uppercase tracking-[0.14em] text-[#9487b8]">
                  <label className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={currentPageHasStudents}
                      onChange={toggleSelectAllCurrentPage}
                      className="h-4 w-4 accent-[#8d73ea]"
                    />
                  </label>
                  <span>Enrollment</span>
                  <span>Student Name</span>
                  <span>Centre</span>
                  <span>Batch</span>
                  <span>Course</span>
                  <span>Latest Score</span>
                </div>

                {isLoadingCandidates ? (
                  <div className="flex items-center justify-center gap-3 bg-[#191427] px-5 py-10 text-[#cebaff]">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Loading candidates...
                  </div>
                ) : visibleCandidates.length === 0 ? (
                  <div className="bg-[#191427] px-5 py-10 text-center text-[#9487b8]">
                    No candidates matched the current filters.
                  </div>
                ) : (
                  visibleCandidates.map((student) => {
                    const isSelected = Boolean(selectedStudents[student.student_id]);

                    return (
                      <div
                        key={student.student_id}
                        className={`grid min-w-[980px] grid-cols-[56px_110px_minmax(240px,1.8fr)_140px_110px_160px_130px] items-center gap-4 border-t border-[#2b2240] px-5 py-4 text-sm ${
                          isSelected ? "bg-[#2a2140]" : "bg-[#191427]"
                        }`}
                      >
                        <label className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudent(student)}
                            className="h-4 w-4 accent-[#8d73ea]"
                          />
                        </label>

                        <span className="text-[#d9d1ef]">{student.roll_no}</span>

                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b3052] text-xs font-semibold text-[#f5f1ff]">
                            {getInitials(student.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[#f5f1ff]">{student.name}</p>
                            <p className="truncate text-xs text-[#9487b8]">{student.email}</p>
                          </div>
                        </div>

                        <span className="truncate text-[#d9d1ef]">{student.center || "N/A"}</span>
                        <span className="truncate text-[#d9d1ef]">{student.batch_no || "N/A"}</span>
                        <span className="truncate text-[#d9d1ef]">{student.course || "N/A"}</span>

                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 rounded-full bg-[#3b3052]">
                            <div
                              className="h-1.5 rounded-full bg-[#2bd4df]"
                              style={{ width: `${Math.max(8, Math.min(100, Number(student.latest_score || 0)))}%` }}
                            />
                          </div>
                          <span className="min-w-[2rem] text-[#2bd4df]">{formatScore(student.latest_score)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-[#b9b0d2]">
                <span>
                  Showing {candidateData.results.length} of {candidateData.count} candidates
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCandidateFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                    }
                    disabled={!candidateData.previous}
                    className="rounded-lg border border-[#483b63] p-2 text-[#f5f1ff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="rounded-lg border border-[#483b63] px-3 py-2 text-[#f5f1ff]">
                    {candidateFilters.page}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCandidateFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!candidateData.next}
                    className="rounded-lg border border-[#483b63] p-2 text-[#f5f1ff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === "review" && selectedJd && (
          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
              <h2 className="text-2xl font-semibold text-[#f5f1ff]">Selected Profile</h2>
              <div className="mt-5 flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-xl font-semibold text-[#f5f1ff]">{selectedJd.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#b9b0d2]">
                    <span>{selectedJd.original_filename}</span>
                    <span>•</span>
                    <span>{selectedJd.category || "N/A"}</span>
                    <span>•</span>
                    <span>{formatPackage(selectedJd)}</span>
                  </div>
                </div>

                <span className="shrink-0 rounded-full bg-[#124a69] px-4 py-2 text-sm font-medium text-[#84e4ff]">
                  Level: {interviewDifficulty}
                </span>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#3b3052] bg-[#120d1f]/45 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#9487b8]">Assigned Candidates</p>
                  <p className="mt-2 text-lg font-semibold text-[#f5f1ff]">{selectedStudentList.length} Candidates</p>
                </div>

                <div className="rounded-2xl border border-[#3b3052] bg-[#120d1f]/45 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#9487b8]">Document & Source</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="text-sm text-[#f5f1ff]">{selectedJd.original_filename}</p>
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(selectedJd)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#483b63] px-3 py-2 text-sm text-[#f5f1ff] transition hover:border-[#b89cff]"
                    >
                      <Eye className="h-4 w-4" />
                      View Document
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3b3052] bg-[#120d1f]/45 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#9487b8]">Schedule Window</p>
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      min={minDateTime}
                      onChange={(event) => setScheduledTime(event.target.value)}
                      className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-[#3b3052] bg-[#120d1f]/45 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-[#9487b8]">Interview Complexity</p>
                  <div className="mt-3">
                    <select
                      value={interviewDifficulty}
                      onChange={(event) => setInterviewDifficulty(event.target.value)}
                      className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                    >
                      {interviewDifficultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#cebaff]" />
                <h3 className="text-lg font-semibold text-[#f5f1ff]">Selected Students</h3>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {selectedStudentList.map((student) => (
                  <div
                    key={student.student_id}
                    className="rounded-2xl border border-[#2b2240] bg-[#120d1f]/75 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3b3052] text-sm font-semibold text-[#f5f1ff]">
                        {getInitials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#f5f1ff]">{student.name}</p>
                        <p className="truncate text-xs text-[#9487b8]">{student.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1 text-sm text-[#b9b0d2]">
                      <p>Enrollment: <span className="text-[#f5f1ff]">{student.roll_no}</span></p>
                      <p>Centre: <span className="text-[#f5f1ff]">{student.center || "N/A"}</span></p>
                      <p>Batch: <span className="text-[#f5f1ff]">{student.batch_no || "N/A"}</span></p>
                      <p>Course: <span className="text-[#f5f1ff]">{student.course || "N/A"}</span></p>
                      <p>Latest Score: <span className="text-[#2bd4df]">{formatScore(student.latest_score)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("candidates")}
                className="inline-flex items-center gap-2 rounded-xl border border-[#483b63] px-5 py-3 text-sm font-medium text-[#f5f1ff] transition hover:border-[#b89cff]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={handleSchedule}
                disabled={isScheduling}
                className="inline-flex items-center gap-2 rounded-xl bg-[#8d73ea] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#a88fff] disabled:cursor-not-allowed disabled:bg-[#4a3c69]"
              >
                <CalendarDays className="h-4 w-4" />
                {isScheduling ? "Scheduling..." : "Schedule Interview"}
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-auto border-t border-[#3b3052] bg-[#191426]/80 py-3 text-center text-sm text-[#b9b0d2]">
        © {new Date().getFullYear()} Jetking Institute. All rights reserved.
      </footer>
    </div>
  );
};

export default ScheduleInterview;
