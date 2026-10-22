import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAnalytics } from "../hooks/useAnalytics";
import { useInterviewTable } from "../hooks/useInterviewTable";
import ChartRenderer from "../../../components/ChartRenderer"
import { trainerService } from "../services/trainerService";

// eslint-disable-next-line no-unused-vars
import { downloadInterviewExcel } from "../services/analyticsService";

// eslint-disable-next-line no-unused-vars
const PaginationControls = ({}) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4 px-1">
    <div className="text-sm text-[#b9b0d2]"></div>
  </div>
);

const parseToDate = (dateStr) => {
  if (!dateStr) return null;

  if (
    /\d{4}-\d{2}-\d{2}T/.test(dateStr) ||
    /[A-Z][a-z]{2}, \d{2}/.test(dateStr)
  ) {
    const d = new Date(dateStr);
    return isNaN(d) ? null : d;
  }

  const cleaned = String(dateStr)
    .replace(/^[A-Za-z]+,\s*/, "")
    .trim();

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
    const [dd, mm, yyyy] = cleaned.split("/").map(Number);
    const d = new Date(yyyy, mm - 1, dd, 0, 0, 0);
    return isNaN(d) ? null : d;
  }

  const m = cleaned.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m) {
    const [, dd, mm, yyyy, hh = "0", mi = "0", ss = "0"] = m;
    const d = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(mi),
      Number(ss),
    );
    return isNaN(d) ? null : d;
  }

  const d = new Date(cleaned);
  return isNaN(d) ? null : d;
};

const formatDateOnly = (dateStr) => {
  const d = parseToDate(dateStr);
  if (!d) return "N/A";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  const d = parseToDate(dateStr);
  if (!d) return "N/A";
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
};

const SkeletonRow = ({ cols }) => (
  <tr className="animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3 border-b border-slate-200">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

const TableSkeleton = ({ rows = 8, cols = 6, height = "max-h-[300px]" }) => (
  <div
    className={`bg-[#191426]/95 rounded-2xl shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] overflow-x-auto overflow-y-auto ${height} mb-8`}
  >
    <table className="min-w-full text-sm">
      <thead className="bg-gradient-to-r from-[#221a34] to-[#302647] text-[#f5f1ff] sticky top-0">
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th
              key={i}
              className="px-4 py-3 text-left border-b border-[#3b3052]"
            >
              <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <SkeletonRow key={r} cols={cols} />
        ))}
      </tbody>
    </table>
  </div>
);

const RecruiterHome = ({ hideTopCenters = false }) => {
  const [exporting, setExporting] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);
  const [centers, setCenters] = useState([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [centersLoading, setCentersLoading] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}interviews/download/Excel`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: selectedCenterId ? { center_id: selectedCenterId } : {},
          responseType: "blob",
        },
      );

      if (response.data && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;

        const contentDisposition = response.headers["content-disposition"];
        let filename = "Interview_Report.xlsx";

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(
            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
          );
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, "");
          }
        }

        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Excel download failed:", error);

      if (error.response) {
        if (error.response.status === 401) {
          alert("Authentication failed. Please log in again.");
        } else if (error.response.status === 404) {
          alert("Export endpoint not found. Please contact support.");
        } else {
          alert(
            `Failed to download Excel: ${
              error.response.statusText || "Server error"
            }`,
          );
        }
      } else if (error.request) {
        alert("No response from server. Please check your connection.");
      } else {
        alert(`Failed to download Excel: ${error.message}`);
      }
    } finally {
      setExporting(false);
    }
  };

  const {
    analytics,
    loading: analyticsLoading,
    error: analyticsError,
  } = useAnalytics();

  const {
    interviewTable,
    interviewRatings,
    visualFeedback,
    loading: tableLoading,
    error: tableError,
    pagination,
    loadNext,
    loadPrevious,
  } = useInterviewTable(selectedCenterId);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!["tpo", "admin", "super_admin"].includes(user?.role)) {
      return;
    }

    const loadCenters = async () => {
      try {
        setCentersLoading(true);
        const data = await trainerService.getCenters();
        setCenters(Array.isArray(data) ? data : []);
      } catch {
        setCenters([]);
      } finally {
        setCentersLoading(false);
      }
    };

    loadCenters();
  }, []);

  const handleNext = useCallback(() => {
    if (!pagination?.next || tableLoading) return;
    setIsPaginating(true);
    loadNext();
  }, [pagination?.next, tableLoading, loadNext]);

  const handlePrev = useCallback(() => {
    if (!pagination?.previous || tableLoading) return;
    setIsPaginating(true);
    loadPrevious();
  }, [pagination?.previous, tableLoading, loadPrevious]);

  useEffect(() => {
    if (!tableLoading && isPaginating) {
      const id = requestAnimationFrame(() => setIsPaginating(false));
      return () => cancelAnimationFrame(id);
    }
  }, [tableLoading, isPaginating]);

  const sortedInterviewTable = [...interviewTable].sort((a, b) => {
    const da = parseToDate(a.evaluation_date);
    const db = parseToDate(b.evaluation_date);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    return tb - ta;
  });

  const sortedRatings = [...interviewRatings].sort((a, b) => {
    const da = parseToDate(a.interview_ts);
    const db = parseToDate(b.interview_ts);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    return tb - ta;
  });

  const interviewTableByTimestamp = new Map(
    interviewTable.map((row) => [row.interview_ts, row]),
  );

  const ratingsWithDifficulty = sortedRatings.map((rating) => ({
    ...rating,
    roll_no:
      rating.roll_no ?? interviewTableByTimestamp.get(rating.interview_ts)?.roll_no ?? null,
    student_name:
      rating.student_name ??
      interviewTableByTimestamp.get(rating.interview_ts)?.student_name ??
      null,
    difficulty_level:
      rating.difficulty_level ??
      interviewTableByTimestamp.get(rating.interview_ts)?.difficulty_level ??
      null,
  }));

  const sortedFeedback = [...visualFeedback].sort((a, b) => {
    const da = parseToDate(a.interview_ts);
    const db = parseToDate(b.interview_ts);
    const ta = da ? da.getTime() : 0;
    const tb = db ? db.getTime() : 0;
    return tb - ta;
  });

  // eslint-disable-next-line no-unused-vars
  const exportToCSV = (rows, filename) => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(",")]
      .concat(
        rows.map((r) =>
          headers
            .map((h) => `${r[h] ?? ""}`.replaceAll('"', '""'))
            .map((cell) => (/[,"\n]/.test(cell) ? `"${cell}"` : cell))
            .join(","),
        ),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#0c0915] via-[#1c1630] to-[#241938]">
      <main className="container mx-auto grow px-6 md:px-10 py-10">
        {analyticsError && <p className="text-red-600">{analyticsError}</p>}

        {!analyticsLoading && analytics && (
          <ChartRenderer
            analytics={analytics}
            hideTopCenters={hideTopCenters}
          />
        )}

        <div className="relative">
          {tableLoading && !isPaginating && (
            <div className="flex justify-center items-center absolute inset-0 bg-[#09070f]/70 backdrop-blur-[1px] z-50 rounded-2xl">
              <div className="border-t-4 border-b-4 border-[#8d73ea] w-16 h-16 rounded-full animate-spin"></div>
            </div>
          )}

          <PaginationControls
            next={pagination?.next}
            previous={pagination?.previous}
            onNext={handleNext}
            onPrev={handlePrev}
            interviewCount={interviewTable?.length || 0}
            ratingsCount={interviewRatings?.length || 0}
            feedbackCount={visualFeedback?.length || 0}
            loading={tableLoading}
          />

          {tableError && <p className="text-red-600">{tableError}</p>}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-[#f5f1ff]">
              Interview Table
            </h2>
            <div className="flex items-center gap-3">
              {centers.length > 0 && (
                <select
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                  disabled={centersLoading}
                  className="px-4 py-2 rounded-xl text-sm cursor-pointer transition-all border border-[#4a3c69] bg-[#221a34] text-[#f5f1ff] focus:outline-none focus:ring-2 focus:ring-[#b89cff] disabled:opacity-50"
                >
                  <option value="">All Centers</option>
                  {centers.map((center) => (
                    <option key={center.id} value={String(center.id)}>
                      {center.name}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleExportExcel}
                className={`text-xs md:text-sm border px-4 py-2 rounded-xl cursor-pointer transition-all ${
                  exporting
                    ? "bg-[#3a3052] text-[#9487b8] border-[#483b63]"
                    : "bg-[#8d73ea] text-white hover:bg-[#322547] border-[#8d73ea]"
                }`}
                disabled={exporting}
                aria-busy={exporting ? "true" : "false"}
              >
                {exporting
                  ? "Preparing Excel..."
                  : "Export Interview Data to Excel"}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  disabled={!pagination?.previous || tableLoading}
                  className={`px-4 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                    pagination?.previous && !tableLoading
                      ? "bg-[#221a34] text-[#b9b0d2] hover:bg-[#302647] border border-[#4a3c69]"
                      : "bg-[#3a3052] text-[#9487b8] cursor-not-allowed"
                  }`}
                  aria-busy={tableLoading ? "true" : "false"}
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={!pagination?.next || tableLoading}
                  className={`px-4 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                    pagination?.next && !tableLoading
                      ? "bg-[#8d73ea] text-white hover:bg-[#a88fff] border border-[#8d73ea]"
                      : "bg-[#3a3052] text-[#9487b8] cursor-not-allowed"
                  }`}
                  aria-busy={tableLoading ? "true" : "false"}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          {isPaginating ? (
            <TableSkeleton rows={10} cols={8} height="max-h-[400px]" />
          ) : (
            <div className="bg-[#191426]/95 rounded-2xl shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] overflow-x-auto overflow-y-auto max-h-[400px] mb-8">
              <table className="min-w-[1000px] w-full text-sm">
                <thead className="bg-[#8d73ea] text-white sticky top-0">
                  <tr>
                    {[
                      "Roll No",
                      "Student Name",
                      "Batch No",
                      "Center",
                      "Course",
                      "Evaluation Date",
                      "JD ID",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left border-b border-[#3b3052] font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedInterviewTable.map((r, idx) => (
                    <tr
                      key={idx}
                      className="odd:bg-[#1b1527] even:bg-[#191427] hover:bg-[#221a34] transition-colors"
                    >
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.roll_no}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.student_name}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.batch_no}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.center}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.course}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {formatDateOnly(r.evaluation_date)}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642] capitalize">
                        {r.jd_id}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642] capitalize">
                        {r.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-[#f5f1ff]">
              Interview Ratings
            </h2>
          </div>

          {isPaginating ? (
            <TableSkeleton rows={8} cols={9} height="max-h-[300px]" />
          ) : (
            <div className="bg-[#191426]/95 rounded-2xl shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] overflow-x-auto overflow-y-auto max-h-[300px] mb-8">
              <table className="min-w-[1150px] w-full text-sm">
                <thead className="bg-[#8d73ea] text-white sticky top-0">
                  <tr>
                    {[
                      "Roll No",
                      "Student Name",
                      "Difficulty Level",
                      "Technical Rating",
                      "Communication Rating",
                      "Problem Solving Rating",
                      "Time Management Rating",
                      "Total Rating",
                      "Interview TS",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left border-b border-[#3b3052] font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ratingsWithDifficulty.map((r, i) => (
                    <tr
                      key={i}
                      className="odd:bg-[#1b1527] even:bg-[#191427] hover:bg-[#221a34] transition-colors"
                    >
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.roll_no || "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.student_name || "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642] capitalize">
                        {r.difficulty_level || "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.technical_rating ?? "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.communication_rating ?? "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.problem_solving_rating ?? "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.time_management_rating ?? "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {r.total_rating ?? "-"}
                      </td>
                      <td className="px-4 py-2 border-b border-[#2e2642]">
                        {formatDateTime(r.interview_ts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-[#f5f1ff]">
              Visual Feedback
            </h2>
          </div>

          {isPaginating ? (
            <TableSkeleton rows={8} cols={7} height="max-h-[300px]" />
          ) : (
            <div className="bg-[#191426]/95 rounded-2xl shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] overflow-x-auto overflow-y-auto max-h-[300px] mb-6">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="bg-[#8d73ea] text-white sticky top-0">
                  <tr>
                    {[
                      "Roll No",
                      "Student Name",
                      "Professional Appearance",
                      "Body Language",
                      "Environment",
                      "Distractions",
                      "Interview TS",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left border-b border-[#3b3052] font-semibold"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedFeedback.map((v, i) => {
                    const student = interviewTable.find(
                      (r) => r.roll_no === v.roll_no,
                    );
                    return (
                      <tr
                        key={i}
                        className="odd:bg-[#1b1527] even:bg-[#191427] hover:bg-[#221a34] transition-colors align-top"
                      >
                        <td className="px-4 py-2 border-b border-[#2e2642]">
                          {v.roll_no}
                        </td>
                        <td className="px-4 py-2 border-b border-[#2e2642]">
                          {student?.student_name || "-"}
                        </td>
                        <td className="px-4 py-2 border-b border-[#2e2642]">
                          {v.professional_appearance}
                        </td>
                        <td className="px-4 py-2 border-b border-[#2e2642]">
                          {v.body_language}
                        </td>
                        <td className="px-4 py-2 border-b border-[#2e2642]">
                          {v.environment}
                        </td>
                        <td className="px-4 py-2 border-b border-[#2e2642]">
                          {v.distractions}
                        </td>
                        <td className="px-4 py-2 border-b border-[#2e2642]">
                          {formatDateTime(v.interview_ts)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="text-[#b9b0d2] bg-[#191426]/80 border-t border-[#3b3052] text-center text-sm shadow-sm mt-auto py-3">
        © {new Date().getFullYear()} Jetking Institute. All rights reserved.
      </footer>
    </div>
  );
};

export default RecruiterHome;
