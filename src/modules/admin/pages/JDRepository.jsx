import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, FileText, LoaderCircle, Search, Upload } from "lucide-react";
import {
  confirmJdDraft,
  fetchJobDescriptionDetail,
  fetchJobDescriptions,
  fetchJdDocumentBlob,
  parseJdDocument,
  updateJobDescriptionStatus,
} from "../services/jdRepositoryService";
import { canUploadJd, canViewJdRepository } from "../../../utils/jdRepositoryAccess";

const CATEGORY_OPTIONS = [
  { value: "conceptual", label: "Conceptual" },
  { value: "real", label: "Real" },
];

const DIFFICULTY_OPTIONS = [
  { value: "simple", label: "Simple" },
  { value: "medium", label: "Medium" },
  { value: "complex", label: "Complex" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const emptyDraftForm = {
  title: "",
  category: "conceptual",
  difficulty_level: "simple",
  package_lpa: "",
  jd_text: "",
};

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateTime = (value) => {
  if (!value) return "N/A";

  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const getPackageDisplay = (jd) => {
  if (jd.category === "conceptual" || jd.package_lpa === null) {
    return "N/A";
  }

  return `${jd.package_lpa} LPA`;
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

const JDRepository = () => {
  const currentUser = useMemo(
    () => JSON.parse(localStorage.getItem("user") || "{}"),
    []
  );
  const canViewRepository = canViewJdRepository(currentUser);
  const canUploadRepositoryJd = canUploadJd(currentUser);
  const [selectedFile, setSelectedFile] = useState(null);
  const [draftMeta, setDraftMeta] = useState(null);
  const [draftForm, setDraftForm] = useState(emptyDraftForm);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    difficulty: "",
    status: "",
    page: 1,
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [repositoryData, setRepositoryData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadingDraftId, setLoadingDraftId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [isLoadingRepository, setIsLoadingRepository] = useState(false);
  const [accessDenied, setAccessDenied] = useState(!canViewRepository);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    window.setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const resetDraft = useCallback(() => {
    setSelectedFile(null);
    setDraftMeta(null);
    setDraftForm(emptyDraftForm);
  }, []);

  const loadRepository = useCallback(async (page = filters.page, searchValue = debouncedSearch) => {
    if (!canViewRepository) {
      setAccessDenied(true);
      return;
    }

    setIsLoadingRepository(true);
    try {
      const data = await fetchJobDescriptions({
        page,
        page_size: 10,
        search: searchValue,
        category: filters.category,
        difficulty: filters.difficulty,
        status: filters.status,
      });
      setRepositoryData(data);
      setAccessDenied(false);
    } catch (error) {
      if (error.status === 403) {
        setAccessDenied(true);
        resetDraft();
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setIsLoadingRepository(false);
    }
  }, [
    canViewRepository,
    debouncedSearch,
    filters.category,
    filters.difficulty,
    filters.page,
    filters.status,
    resetDraft,
  ]);

  useEffect(() => {
    loadRepository(filters.page, debouncedSearch);
  }, [debouncedSearch, filters.category, filters.difficulty, filters.page, filters.status, loadRepository]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((repositoryData.count || 0) / 10)),
    [repositoryData.count]
  );

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canUploadRepositoryJd) {
      showToast("You do not have permission to upload JDs.", "error");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);

    try {
      const parsedDraft = await parseJdDocument(file);
      setDraftMeta(parsedDraft);
      setDraftForm({
        title: parsedDraft.title || "",
        category: "conceptual",
        difficulty_level: "simple",
        package_lpa: "",
        jd_text: parsedDraft.jd_text || "",
      });
      showToast("JD parsed successfully.");
      setFilters((prev) => ({ ...prev, status: "draft", page: 1 }));
    } catch (error) {
      resetDraft();
      if (error.status === 403) {
        setAccessDenied(true);
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  const handlePublish = async (event) => {
    event.preventDefault();
    if (!draftMeta?.jd_id) {
      showToast("Upload and parse a JD before publishing.", "error");
      return;
    }

    if (!canUploadRepositoryJd) {
      showToast("You do not have permission to publish JDs.", "error");
      return;
    }

    setIsPublishing(true);
    try {
      const payload = {
        title: draftForm.title.trim(),
        category: draftForm.category,
        difficulty_level: draftForm.difficulty_level,
        package_lpa: draftForm.category === "real" ? draftForm.package_lpa || null : null,
        jd_text: draftForm.jd_text.trim(),
      };

      await confirmJdDraft(draftMeta.jd_id, payload);
      showToast("JD published successfully.");
      resetDraft();
      setFilters((prev) => ({ ...prev, status: "published", page: 1 }));
      await loadRepository(1, debouncedSearch);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const openDocument = async (jd, download = false) => {
    try {
      const blob = await fetchJdDocumentBlob(jd.document_url, download);
      const blobUrl = window.URL.createObjectURL(blob);

      if (download) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = jd.original_filename || "job-description";
        link.click();
      } else {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      if (error.status === 403) {
        setAccessDenied(true);
      } else {
        showToast(error.message, "error");
      }
    }
  };

  const handleContinueUpload = async (jd) => {
    if (!canUploadRepositoryJd) {
      showToast("You do not have permission to publish JDs.", "error");
      return;
    }

    setLoadingDraftId(jd.id);
    try {
      const detail = await fetchJobDescriptionDetail(jd.id);
      setSelectedFile(null);
      setDraftMeta({
        jd_id: detail.id,
        original_filename: detail.original_filename,
        document_size: detail.document_size,
        status: detail.status,
      });
      setDraftForm({
        title: detail.title || "",
        category: detail.category || "conceptual",
        difficulty_level: detail.difficulty_level || "simple",
        package_lpa: detail.package_lpa || "",
        jd_text: detail.jd_text || "",
      });
    } catch (error) {
      if (error.status === 403) {
        setAccessDenied(true);
        resetDraft();
      } else {
        showToast(error.message, "error");
      }
    } finally {
      setLoadingDraftId(null);
    }
  };

  const handleStatusChange = async (jd, nextStatus) => {
    if (!canUploadRepositoryJd) {
      showToast("You do not have permission to update JD status.", "error");
      return;
    }

    setUpdatingStatusId(jd.id);
    try {
      await updateJobDescriptionStatus(jd.id, nextStatus);
      showToast(
        nextStatus === "archived"
          ? "JD archived successfully."
          : "JD published successfully."
      );
      await loadRepository(filters.page, debouncedSearch);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] p-8">
        <Toast toast={toast} />
        <div className="mx-auto mt-16 max-w-2xl rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-8 text-center shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a2140]">
            <FileText className="h-7 w-7 text-[#cebaff]" />
          </div>
          <h1 className="text-2xl font-bold text-[#f5f1ff]">JD Repository access denied</h1>
          <p className="mt-3 text-sm leading-6 text-[#b9b0d2]">
            This account is not authorized to list, view, upload, or publish job descriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] p-8">
      <Toast toast={toast} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f5f1ff]">JD Repository</h1>
        <p className="mt-2 text-sm text-[#b9b0d2]">
          Upload, review, publish, and browse reusable job descriptions for interview scheduling.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {canUploadRepositoryJd && (
        <section className="rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#2a2140] p-3">
              <Upload className="h-5 w-5 text-[#cebaff]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#f5f1ff]">Upload New JD</h2>
              <p className="text-sm text-[#9487b8]">PDF and DOCX up to 10 MB.</p>
            </div>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#4b3d69] bg-[#120d1f]/60 px-6 py-10 text-center transition hover:border-[#b89cff] hover:bg-[#1a1430]">
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={isParsing || isPublishing}
            />
            <Upload className="mb-3 h-9 w-9 text-[#b89cff]" />
            <span className="text-base font-medium text-[#f5f1ff]">
              {selectedFile ? selectedFile.name : "Choose a JD document to parse"}
            </span>
            <span className="mt-2 text-sm text-[#9487b8]">
              The backend stores the original file privately and returns editable text.
            </span>
          </label>

          {isParsing && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#3b3052] bg-[#120d1f]/70 px-4 py-3 text-sm text-[#cebaff]">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Parsing JD document...
            </div>
          )}

        </section>
        )}

        <section className="rounded-3xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#f5f1ff]">Repository List</h2>
              <p className="text-sm text-[#9487b8]">Browse drafts and published JDs.</p>
            </div>
            <div className="rounded-full border border-[#3b3052] bg-[#120d1f]/70 px-4 py-2 text-sm text-[#b9b0d2]">
              {repositoryData.count} total
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9487b8]" />
              <input
                type="text"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))
                }
                placeholder="Search title, filename, or JD text"
                className="w-full rounded-xl border border-[#483b63] bg-[#191427] py-3 pl-11 pr-4 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
              />
            </label>

            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, category: event.target.value, page: 1 }))
              }
              className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.difficulty}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, difficulty: event.target.value, page: 1 }))
              }
              className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
            >
              <option value="">All difficulty levels</option>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))
              }
              className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff] md:col-span-2"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 space-y-3">
            {isLoadingRepository ? (
              <div className="flex items-center justify-center rounded-2xl border border-[#3b3052] bg-[#120d1f]/70 px-4 py-8 text-[#cebaff]">
                <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
                Loading repository...
              </div>
            ) : repositoryData.results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#3b3052] bg-[#120d1f]/50 px-4 py-8 text-center text-[#9487b8]">
                No job descriptions matched the current filters.
              </div>
            ) : (
              repositoryData.results.map((jd) => (
                <article
                  key={jd.id}
                  className="rounded-2xl border border-[#3b3052] bg-[#120d1f]/75 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#cebaff]" />
                        <h3 className="truncate text-base font-semibold text-[#f5f1ff]">
                          {jd.title || "Untitled JD"}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm text-[#b9b0d2]">{jd.original_filename}</p>
                    </div>
                    <span className="rounded-full bg-[#2a2140] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[#cebaff]">
                      {jd.status}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-[#b9b0d2] md:grid-cols-2">
                    <p>Category: <span className="text-[#f5f1ff]">{jd.category || "N/A"}</span></p>
                    <p>Difficulty: <span className="text-[#f5f1ff]">{jd.difficulty_level || "N/A"}</span></p>
                    <p>Package: <span className="text-[#f5f1ff]">{getPackageDisplay(jd)}</span></p>
                    <p>Uploaded by: <span className="text-[#f5f1ff]">{jd.uploaded_by_name || "N/A"}</span></p>
                    <p>Updated: <span className="text-[#f5f1ff]">{formatDateTime(jd.updated_at)}</span></p>
                    <p>Published: <span className="text-[#f5f1ff]">{formatDateTime(jd.published_at)}</span></p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openDocument(jd)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#483b63] px-4 py-2 text-sm font-medium text-[#f5f1ff] transition hover:border-[#b89cff]"
                    >
                      <Eye className="h-4 w-4" />
                      View document
                    </button>
                    <button
                      type="button"
                      onClick={() => openDocument(jd, true)}
                      className="rounded-xl border border-[#483b63] px-4 py-2 text-sm font-medium text-[#b9b0d2] transition hover:border-[#b89cff] hover:text-[#f5f1ff]"
                    >
                      Download
                    </button>
                    {jd.status === "draft" && canUploadRepositoryJd && (
                      <button
                        type="button"
                        onClick={() => handleContinueUpload(jd)}
                        disabled={loadingDraftId === jd.id}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#8d73ea] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a88fff] disabled:cursor-not-allowed disabled:bg-[#4a3c69]"
                      >
                        {loadingDraftId === jd.id && (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                        {loadingDraftId === jd.id ? "Loading..." : "Continue Upload"}
                      </button>
                    )}
                    {jd.status === "published" && canUploadRepositoryJd && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(jd, "archived")}
                        disabled={updatingStatusId === jd.id}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl border border-[#7a3551] px-4 py-2 text-sm font-medium text-[#ffb3c9] transition hover:border-[#ff8fb3] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingStatusId === jd.id && (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                        {updatingStatusId === jd.id ? "Archiving..." : "Archive"}
                      </button>
                    )}
                    {jd.status === "archived" && canUploadRepositoryJd && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(jd, "published")}
                        disabled={updatingStatusId === jd.id}
                        className="ml-auto inline-flex items-center gap-2 rounded-xl bg-[#8d73ea] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#a88fff] disabled:cursor-not-allowed disabled:bg-[#4a3c69]"
                      >
                        {updatingStatusId === jd.id && (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                        {updatingStatusId === jd.id ? "Publishing..." : "Publish"}
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={!repositoryData.previous}
              className="rounded-xl border border-[#483b63] px-4 py-2 text-sm font-medium text-[#f5f1ff] transition hover:border-[#b89cff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-[#b9b0d2]">
              Page {filters.page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={!repositoryData.next}
              className="rounded-xl border border-[#483b63] px-4 py-2 text-sm font-medium text-[#f5f1ff] transition hover:border-[#b89cff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      </div>

      {draftMeta && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <form
            className="scrollbar-hidden max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#3b3052] bg-[#191426] p-6 shadow-[0_24px_70px_rgba(3,2,8,0.7)]"
            onSubmit={handlePublish}
          >
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#f5f1ff]">Continue JD Upload</h2>
                <p className="mt-1 text-sm text-[#9487b8]">
                  Review the extracted JD text, edit details, then publish it.
                </p>
              </div>
              <button
                type="button"
                onClick={resetDraft}
                disabled={isPublishing || isParsing}
                className="rounded-xl border border-[#483b63] px-4 py-2 text-sm font-medium text-[#b9b0d2] transition hover:border-[#b89cff] hover:text-[#f5f1ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#3b3052] bg-[#120d1f]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#9487b8]">Original file</p>
                <p className="mt-2 text-sm text-[#f5f1ff]">{draftMeta.original_filename}</p>
                <p className="mt-1 text-sm text-[#b9b0d2]">
                  {formatFileSize(draftMeta.document_size)}
                </p>
              </div>
              <div className="rounded-2xl border border-[#3b3052] bg-[#120d1f]/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#9487b8]">Draft status</p>
                <p className="mt-2 text-sm text-[#f5f1ff]">ID {draftMeta.jd_id}</p>
                <p className="mt-1 text-sm text-[#b9b0d2]">{draftMeta.status}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[#b9b0d2]">JD title</label>
                <input
                  type="text"
                  value={draftForm.title}
                  onChange={(event) =>
                    setDraftForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[#b9b0d2]">Category</label>
                <select
                  value={draftForm.category}
                  onChange={(event) =>
                    setDraftForm((prev) => ({
                      ...prev,
                      category: event.target.value,
                      package_lpa: event.target.value === "real" ? prev.package_lpa : "",
                    }))
                  }
                  className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-[#b9b0d2]">Difficulty</label>
                <select
                  value={draftForm.difficulty_level}
                  onChange={(event) =>
                    setDraftForm((prev) => ({ ...prev, difficulty_level: event.target.value }))
                  }
                  className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {draftForm.category === "real" ? (
                <div>
                  <label className="mb-1 block text-sm text-[#b9b0d2]">Package (LPA)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draftForm.package_lpa}
                    onChange={(event) =>
                      setDraftForm((prev) => ({ ...prev, package_lpa: event.target.value }))
                    }
                    className="w-full rounded-xl border border-[#483b63] bg-[#191427] px-4 py-3 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
                  />
                </div>
              ) : null}
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm text-[#b9b0d2]">JD text</label>
              <textarea
                rows={14}
                value={draftForm.jd_text}
                onChange={(event) =>
                  setDraftForm((prev) => ({ ...prev, jd_text: event.target.value }))
                }
                className="scrollbar-hidden w-full rounded-2xl border border-[#483b63] bg-[#191427] px-4 py-3 text-sm leading-6 text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff]"
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={resetDraft}
                disabled={isPublishing || isParsing}
                className="rounded-xl border border-[#483b63] px-5 py-3 font-medium text-[#b9b0d2] transition hover:border-[#b89cff] hover:text-[#f5f1ff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear draft
              </button>
              <button
                type="submit"
                disabled={isPublishing || isParsing}
                className="rounded-xl bg-[#8d73ea] px-5 py-3 font-medium text-white transition hover:bg-[#a88fff] disabled:cursor-not-allowed disabled:bg-[#4a3c69]"
              >
                {isPublishing ? "Publishing..." : "Confirm and Publish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default JDRepository;
