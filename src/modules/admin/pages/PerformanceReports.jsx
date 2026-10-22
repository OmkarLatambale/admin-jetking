import React, { useEffect, useState } from "react";
import { useReports, useReportDetail } from "../hooks/useReports";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";

// PDF libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RED = "#133d7e"; // #b31e35
const STAGE_ORDER = ["starting", "learning", "improving", "ready", "confident"];

function titleCaseStage(v) {
  if (!v) return "N/A";
  const s = String(v).toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeStage(v) {
  if (!v) return null;
  return String(v).toLowerCase().trim();
}

function arrowForMovement(first, latest) {
  const f = STAGE_ORDER.indexOf(normalizeStage(first));
  const l = STAGE_ORDER.indexOf(normalizeStage(latest));
  if (f === -1 || l === -1) return "–";
  const diff = l - f;
  if (diff <= 0) return "–";
  if (diff === 1) return "↑";
  if (diff === 2) return "↑↑";
  return "↑↑↑";
}

const formatDateString = (dateStr) => {
  try {
    if (!dateStr) return "N/A";

    const cleaned = dateStr.replace(/^[A-Za-z]+,\s*/, "").trim();
    const [datePart, timePart] = cleaned.split(" ");
    if (!datePart) return dateStr;

    const [day, month, year] = datePart.split("/").map(Number);
    const [hour = 0, minute = 0, second = 0] = (timePart || "00:00:00")
      .split(":")
      .map(Number);

    const jsDate = new Date(year, month - 1, day, hour, minute, second);
    if (isNaN(jsDate.getTime())) return dateStr;

    const date = jsDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const time = jsDate.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    return `${date} ${time}`;
  } catch {
    return dateStr;
  }
};

const PerformanceReport = () => {
  const { reports, loading, error, loadReports, nextUrl, prevUrl } =
    useReports();

  const drawUpArrow = (doc, x, y, size = 10) => {
    // stem
    doc.setLineWidth(1.2);
    doc.line(x, y + size, x, y + 3);

    // triangle head
    doc.triangle(x - 3.5, y + 5.5, x + 3.5, y + 5.5, x, y, "S");
  };

  const drawDash = (doc, x, y, w = 10) => {
    doc.setLineWidth(1.2);
    doc.line(x - w / 2, y + 6, x + w / 2, y + 6);
  };

  const movementToCount = (movement) => {
    const m = String(movement || "").trim();
    if (m === "—" || m === "-" || m === "–" || m === "") return 0;
    // count how many arrows in string, fallback to 1 if any "up" found
    const count = (m.match(/↑/g) || []).length;
    return count > 0 ? count : 1;
  };

  // eslint-disable-next-line no-unused-vars
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const {
    report,
    loading: detailLoading,
    error: detailError,
  } = useReportDetail(selectedReportId);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNextPage = () => {
    if (nextUrl && !loading) loadReports(nextUrl);
  };

  const handlePrevPage = () => {
    if (prevUrl && !loading) loadReports(prevUrl);
  };
  const getReportPath = (reportId) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (user?.role === "academic_head") {
      return `/branch-admin/reports/${reportId}`;
    }

    if (user?.role === "placement_officer") {
      return `/placement-officer/reports/${reportId}`;
    }

    return `/reports/${reportId}`;
  };

  const addPageNumbers = (doc) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, {
        align: "center",
      });
    }
  };

  // ✅ Normalize report (career_readiness + duplicated top-level fields)
  const normalizeReport = (r) => {
    if (!r) return r;

    const cr = r.career_readiness || {};
    return {
      ...r,
      career_readiness: {
        session_number: cr.session_number ?? r.session_number ?? null,
        stages: cr.stages ?? r.stages ?? null,
        what_you_did_well: cr.what_you_did_well ?? r.what_you_did_well ?? [],
        what_to_practice_next:
          cr.what_to_practice_next ?? r.what_to_practice_next ?? [],
        tips_for_next_interview:
          cr.tips_for_next_interview ?? r.tips_for_next_interview ?? [],
        professional_behaviour_summary:
          cr.professional_behaviour_summary ??
          r.professional_behaviour_summary ??
          null,
      },
      stage_legend: r.stage_legend ?? {},
      progress: r.progress ?? null,
    };
  };

  // download report as pdf (✅ matches ViewReport page PDF format)
  const handleDownloadReport = async (reportId) => {
    setDownloadingId(reportId);

    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      const base = import.meta.env.VITE_API_URL || "";
      const apiBase = base.replace(/\/$/, "");

      const response = await fetch(
        `${apiBase}/interviews/reports/${reportId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch report");

      const raw = await response.json();
      const reportData = normalizeReport(raw);

      // ===== Section A (Summary)
      const stages = reportData?.career_readiness?.stages || {};
      const sectionA = [
        ["Knowledge", titleCaseStage(stages.knowledge)],
        ["Understanding", titleCaseStage(stages.understanding)],
        ["Communication", titleCaseStage(stages.communication)],
        [
          "Professional Behaviour",
          titleCaseStage(stages.professional_behaviour),
        ],
      ];

      // ===== Section B (Progress) supports your backend shape:
      // progress: { knowledge:{first_session, latest_session, movement}, ... }
      const progress = reportData?.progress;
      const sectionBEmpty = [
        ["Knowledge", "N/A", "N/A", "–"],
        ["Understanding", "N/A", "N/A", "–"],
        ["Communication", "N/A", "N/A", "–"],
        ["Professional Behaviour", "N/A", "N/A", "–"],
      ];

      let sectionB = sectionBEmpty;

      if (
        progress &&
        typeof progress === "object" &&
        !Array.isArray(progress)
      ) {
        const pick = (key) => progress?.[key] || null;

        sectionB = [
          ["Knowledge", pick("knowledge")],
          ["Understanding", pick("understanding")],
          ["Communication", pick("communication")],
          ["Professional Behaviour", pick("professional_behaviour")],
        ].map(([label, obj]) => {
          const first = obj?.first_session
            ? titleCaseStage(obj.first_session)
            : "N/A";
          const latest = obj?.latest_session
            ? titleCaseStage(obj.latest_session)
            : "N/A";

          const movement =
            obj?.movement !== null &&
            obj?.movement !== undefined &&
            obj?.movement !== ""
              ? String(obj.movement)
              : arrowForMovement(first, latest);

          return [label, first, latest, movement];
        });
      } else if (Array.isArray(progress) && progress.length > 0) {
        // Optional: if backend later sends session-wise array
        const sorted = [...progress].sort(
          (a, b) => (a.session_number ?? 0) - (b.session_number ?? 0),
        );

        const firstStages = sorted[0]?.stages || null;
        const latestStages = sorted[sorted.length - 1]?.stages || null;

        const get = (s, k) => (s && s[k] ? s[k] : null);

        sectionB = [
          [
            "Knowledge",
            get(firstStages, "knowledge"),
            get(latestStages, "knowledge"),
          ],
          [
            "Understanding",
            get(firstStages, "understanding"),
            get(latestStages, "understanding"),
          ],
          [
            "Communication",
            get(firstStages, "communication"),
            get(latestStages, "communication"),
          ],
          [
            "Professional Behaviour",
            get(firstStages, "professional_behaviour"),
            get(latestStages, "professional_behaviour"),
          ],
        ].map(([area, first, latest]) => {
          const f = titleCaseStage(first);
          const l = titleCaseStage(latest);
          return [area, f, l, arrowForMovement(f, l)];
        });
      }

      // ===== Legend
      const legend =
        reportData.stage_legend && typeof reportData.stage_legend === "object"
          ? reportData.stage_legend
          : {};

      const legendRows = Object.keys(legend).length
        ? Object.entries(legend).map(([k, v]) => [titleCaseStage(k), String(v)])
        : [
            [
              "Starting",
              "Beginning the journey — building foundational awareness",
            ],
            ["Learning", "Gaining knowledge — starting to apply concepts"],
            ["Improving", "Making progress — developing consistency"],
            ["Ready", "Well-prepared — demonstrating competence"],
            ["Confident", "Fully equipped — ready for professional challenges"],
          ];

      // ===== PDF
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      let cursorY = 54;

      // Title (same as ViewReport)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Jetking Career Readiness Report", pageWidth / 2, cursorY, {
        align: "center",
      });
      cursorY += 18;

      // Candidate Name | Session No | Course | Center (same as ViewReport)
      const candidateName = reportData.student_name ?? "N/A";
      const sessionNo =
        reportData.career_readiness?.session_number ??
        reportData.session_number ??
        "N/A";
      const course = reportData.student_course ?? reportData.course ?? "N/A";
      const center = reportData.student_center ?? reportData.center ?? "N/A";

      autoTable(doc, {
        startY: cursorY,
        head: [["Candidate Name", "Session No", "Course", "Center"]],
        body: [[candidateName, String(sessionNo), course, center]],
        theme: "grid",
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: RED, textColor: 255, halign: "left" },
        margin: { left: marginX, right: marginX },
      });

      cursorY = doc.lastAutoTable.finalY + 18;

      // Section A
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Section A — Career Readiness Summary", marginX, cursorY);
      cursorY += 8;

      autoTable(doc, {
        startY: cursorY + 6,
        head: [["Area", "Current Stage"]],
        body: sectionA,
        theme: "grid",
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: RED, textColor: 255, halign: "left" },
        margin: { left: marginX, right: marginX },
      });

      cursorY = doc.lastAutoTable.finalY + 16;

      // Legend (small)
      autoTable(doc, {
        startY: cursorY,
        head: [["Stage", "Meaning"]],
        body: legendRows,
        theme: "grid",
        styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: 30,
          halign: "left",
        },
        margin: { left: marginX, right: marginX },
      });

      cursorY = doc.lastAutoTable.finalY + 16;

      // Section B
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Section B — Your Progress So Far", marginX, cursorY);
      cursorY += 8;

      autoTable(doc, {
        startY: cursorY + 6,
        head: [["Area", "First Session", "Latest Session", "Movement"]],
        body: sectionB, // sectionB rows: [Area, First, Latest, Movement]
        theme: "grid",
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: RED, textColor: 255, halign: "left" },
        margin: { left: marginX, right: marginX },

        // ✅ draw arrows as icons in Movement column
        didParseCell: (data) => {
          // Movement column index = 3
          if (data.section === "body" && data.column.index === 3) {
            // hide any unicode text so it never renders garbage
            data.cell.text = [""];
          }
        },

        didDrawCell: (data) => {
          if (data.section !== "body") return;
          if (data.column.index !== 3) return;

          const rawMovement = sectionB?.[data.row.index]?.[3];
          const count = movementToCount(rawMovement);

          const x = data.cell.x;
          const y = data.cell.y;
          const w = data.cell.width;
          const h = data.cell.height;

          // center point inside the cell
          const cx = x + w / 2;
          const cy = y + (h - 12) / 2; // vertical alignment tweak

          // set arrow color (Jetking red)
          doc.setDrawColor(RED[0], RED[1], RED[2]);

          if (count <= 0) {
            drawDash(doc, cx, cy, 12);
            return;
          }

          // draw 1,2,3 arrows side-by-side
          const max = Math.min(count, 3);
          const gap = 10;
          const startX = cx - ((max - 1) * gap) / 2;

          for (let i = 0; i < max; i++) {
            drawUpArrow(doc, startX + i * gap, cy, 10);
          }
        },
      });

      cursorY = doc.lastAutoTable.finalY + 16;

      // Professional Behaviour summary (ONE line only)
      const pb = reportData.career_readiness?.professional_behaviour_summary;
      if (pb) {
        autoTable(doc, {
          startY: cursorY,
          head: [["Professional Behaviour (Summary)"]],
          body: [[String(pb)]],
          theme: "grid",
          styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
          headStyles: {
            fillColor: [245, 245, 245],
            textColor: 30,
            halign: "left",
          },
          margin: { left: marginX, right: marginX },
        });
        cursorY = doc.lastAutoTable.finalY + 14;
      }

      // Bullets sections (same titles as ViewReport)
      const addBullets = (title, arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(title, marginX, cursorY);
        cursorY += 10;

        autoTable(doc, {
          startY: cursorY,
          head: [["Points"]],
          body: arr.map((x) => [String(x)]),
          theme: "grid",
          styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: RED, textColor: 255, halign: "left" },
          columnStyles: { 0: { cellWidth: pageWidth - marginX * 2 } },
          margin: { left: marginX, right: marginX },
        });

        cursorY = doc.lastAutoTable.finalY + 14;
      };

      addBullets(
        "Section C — What You Did Well ",
        reportData.career_readiness?.what_you_did_well,
      );
      addBullets(
        "Section D — What To Practice Next ",
        reportData.career_readiness?.what_to_practice_next,
      );
      addBullets(
        "Section E — Tips For Next Interview ",
        reportData.career_readiness?.tips_for_next_interview,
      );

      // Footer
      addPageNumbers(doc);

      // Save
      const safeName = (reportData.student_name || "candidate")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");
      doc.save(`career-readiness-${safeName}-${reportId}.pdf`);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download report. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938]">
      <div className="p-6 flex-1 relative">
        {/* Loader */}
        {(loading || detailLoading) && (
          <div className="flex justify-center items-center absolute inset-0 bg-[#09070f]/70 backdrop-blur-sm z-50 rounded-2xl">
            <div className="border-t-4 border-b-4 border-[#8d73ea] w-16 h-16 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-[#f5f1ff] mb-4">
          Performance Reports
        </h1>

        {/* ===== Table Section ===== */}
        {error ? (
          <div className="bg-[#FAD4D4] border border-[#F1A5A5] text-[#7A1C1C] px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : reports.length === 0 && !loading ? (
          <div className="bg-[#221a34] border border-[#3b3052] text-[#b9b0d2] px-4 py-3 rounded-lg">
            No reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table */}
            <table className="w-full bg-[#191426]/95 shadow-[0_18px_48px_rgba(3,2,8,0.45)] rounded-2xl overflow-hidden border border-[#3b3052]">
              {/* Header */}
              <thead>
                <tr className="bg-gradient-to-r from-[#2a2140] to-[#8d73ea] text-white text-left text-sm">
                  {[
                    "Student Name",
                    "Roll No",
                    "Batch No",
                    "Center",
                    "Course",
                    "Evaluation Date",
                    "Difficulty",
                    "Interview Time",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body */}
              <tbody className="text-sm">
                {reports.map((r, index) => (
                  <tr
                    key={r.report_id}
                    className={`transition ${
                      index % 2 === 0 ? "bg-[#1b1527]" : "bg-[#191427]"
                    } hover:bg-[#221a34]`}
                  >
                    <td className="px-4 py-3 border-r border-[#2e2642]">
                      {r.student_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 border-r border-[#2e2642]">
                      {r.roll_no || "N/A"}
                    </td>
                    <td className="px-4 py-3 border-r border-[#2e2642]">
                      {r.batch_no || "N/A"}
                    </td>
                    <td className="px-4 py-3 border-r border-[#2e2642]">
                      {r.center || "N/A"}
                    </td>
                    <td className="px-4 py-3 border-r border-[#2e2642]">
                      {r.course || "N/A"}
                    </td>
                    <td className="px-4 py-3 border-r border-[#2e2642]">
                      {r.evaluation_date
                        ? formatDateString(r.evaluation_date)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 border-r border-[#2e2642] capitalize">
                      {r.difficulty_level || "N/A"}
                    </td>
                    <td className="px-4 py-3 border-r border-[#2e2642]">
                      {r.interview_time
                        ? formatDateString(r.interview_time)
                        : "N/A"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2  ">
                        {/* View */}
                        <Link to={getReportPath(r.report_id)}>
                          <button className="bg-[#b89cff] text-black px-4 py-2 rounded-lg shadow-sm hover:bg-[#7b60db]  transition cursor-pointer">
                            View
                          </button>
                        </Link>

                        {/* Download */}
                        <button
                          onClick={() => handleDownloadReport(r.report_id)}
                          disabled={downloadingId === r.report_id}
                          className="bg-[#8d73ea] text-white px-3 py-2 rounded-lg shadow-sm hover:bg-[#6a50c9] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                        >
                          {downloadingId === r.report_id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#c7b6ff] border-t-transparent rounded-full animate-spin"></div>
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ===== Pagination ===== */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={handlePrevPage}
                disabled={!prevUrl || loading}
                className="px-6 py-2 bg-[#8d73ea] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a88fff] transition font-medium cursor-pointer"
              >
                ← Previous
              </button>

              <span className="text-[#b9b0d2] text-sm">
                {reports.length > 0
                  ? `Showing ${reports.length} reports`
                  : "No reports"}
              </span>

              <button
                onClick={handleNextPage}
                disabled={!nextUrl || loading}
                className="px-6 py-2 bg-[#8d73ea] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#a88fff] transition font-medium cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ===== Detail Preview ===== */}
        {selectedReportId && (
          <div className="mt-6 bg-[#191426]/95 shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3 text-[#f5f1ff]">
              Report Details (ID: {selectedReportId})
            </h2>

            {detailError ? (
              <p className="text-red-500">{detailError}</p>
            ) : report ? (
              <div className="space-y-4 text-sm text-[#b9b0d2]">
                <div>
                  <h3 className="font-semibold text-[#f5f1ff]">
                    Key Strengths
                  </h3>
                  <ul className="list-disc ml-5">
                    {report.key_strengths?.map((s, i) => (
                      <li key={i}>
                        {s.area} (Rating: {s.rating}/5) – {s.example}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#f5f1ff]">
                    Areas for Improvement
                  </h3>
                  <ul className="list-disc ml-5">
                    {report.areas_for_improvement?.map((a, i) => (
                      <li key={i}>
                        {a.area} – {a.suggestions}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-[#f5f1ff]">Ratings</h3>
                  <p>Total: {report.ratings?.total ?? "N/A"}/20</p>
                  <p>Technical: {report.ratings?.technical ?? "N/A"}/5</p>
                  <p>Time Management: {report.ratings?.time_mgmt ?? "N/A"}/5</p>
                  <p>
                    Communication: {report.ratings?.communication ?? "N/A"}/5
                  </p>
                  <p>
                    Problem Solving: {report.ratings?.problem_solving ?? "N/A"}
                    /5
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-[#b9b0d2] text-center text-sm mt-auto py-3 bg-[#191426]/80 border-t border-[#3b3052]">
        © {new Date().getFullYear()} Jetking Institute. All rights reserved.
      </footer>
    </div>
  );
};

export default PerformanceReport;
