// ViewReport.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

// PDF libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RED = "#133d7e"; // #b31e35

// Stage order for movement arrows
const STAGE_ORDER = ["starting", "learning", "improving", "ready", "confident"];

function titleCaseStage(v) {
  if (!v) return "N/A";
  const s = String(v).toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeStage(v) {
  if (!v) return null;
  const s = String(v).toLowerCase().trim();
  return STAGE_ORDER.includes(s) ? s : s;
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

export default function ViewReport() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const navigate = useNavigate();



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
  // const isNewCareerReadinessReady = (r) => {
  //   const cr = r?.career_readiness;
  //   const stages = cr?.stages;

  //   const hasStages =
  //     stages && typeof stages === "object" && Object.keys(stages).length > 0;

  //   const hasProgress =
  //     r?.progress && typeof r.progress === "object" && !Array.isArray(r.progress);

  //   const hasSections =
  //     Array.isArray(cr?.what_you_did_well) &&
  //     Array.isArray(cr?.what_to_practice_next) &&
  //     Array.isArray(cr?.tips_for_next_interview);

  //   // If any of these are missing, the report will look like "N/A"
  //   return Boolean(hasStages && hasSections && hasProgress);
  // };

  const token =
    localStorage.getItem("token") || localStorage.getItem("accessToken");
  const API_BASE = import.meta.env.VITE_API_URL || "";

  // ✅ Normalize new API response (career_readiness + duplicated top-level fields)
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

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE.replace(/\/$/, "")}/interviews/reports/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch report");
        const data = await res.json();
        setReport(normalizeReport(data));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id, token, API_BASE]);

  // === Report fields for header
  const headerMeta = useMemo(() => {
    if (!report) return null;
    const cr = report.career_readiness || {};
    return {
      candidate_name: report.student_name ?? "N/A",
      session_no: cr.session_number ?? "N/A",
      course: report.student_course ?? report.course ?? "N/A",
      center: report.student_center ?? report.center ?? "N/A",
      // extra (optional)
      roll_no: report.student_id ?? report.roll_no ?? null,
      batch_no: report.student_batch ?? report.batch_no ?? null,
    };
  }, [report]);

  // === Section A stages (ONLY 4 areas)
  const sectionA = useMemo(() => {
    const stages = report?.career_readiness?.stages;
    const safe = (k) => (stages && stages[k] ? stages[k] : null);

    return [
      ["Knowledge", titleCaseStage(safe("knowledge"))],
      ["Understanding", titleCaseStage(safe("understanding"))],
      ["Communication", titleCaseStage(safe("communication"))],
      ["Professional Behaviour", titleCaseStage(safe("professional_behaviour"))],
    ];
  }, [report]);

  // === Section B progress (session-wise)
  // Supports 2 formats:
  // 1) progress = [{session_number: 1, stages:{...}}, ...]
  // 2) progress = { first_session:{stages:{...}}, latest_session:{stages:{...}} }
  // === Section B — Your Progress So Far (supports multiple backend shapes)
  const sectionB = useMemo(() => {
    const progress = report?.progress;

    const empty = [
      ["Knowledge", "N/A", "N/A", "–"],
      ["Understanding", "N/A", "N/A", "–"],
      ["Communication", "N/A", "N/A", "–"],
      ["Professional Behaviour", "N/A", "N/A", "–"],
    ];

    // ✅ Shape (A): the one you just shared
    // progress: { knowledge:{first_session, latest_session, movement}, ... }
    if (progress && typeof progress === "object" && !Array.isArray(progress)) {
      const pick = (key) => progress?.[key] || null;

      const rows = [
        ["Knowledge", pick("knowledge")],
        ["Understanding", pick("understanding")],
        ["Communication", pick("communication")],
        ["Professional Behaviour", pick("professional_behaviour")],
      ].map(([label, obj]) => {
        const first = obj?.first_session ? titleCaseStage(obj.first_session) : "N/A";
        const latest = obj?.latest_session ? titleCaseStage(obj.latest_session) : "N/A";

        // backend gives movement as "—" (em dash). keep it.
        const movement =
          obj?.movement !== null && obj?.movement !== undefined && obj?.movement !== ""
            ? String(obj.movement)
            : arrowForMovement(first, latest);

        return [label, first, latest, movement];
      });

      return rows;
    }

    // ✅ Shape (B): array of session objects (optional future)
    if (Array.isArray(progress) && progress.length > 0) {
      const sorted = [...progress].sort(
        (a, b) => (a.session_number ?? 0) - (b.session_number ?? 0)
      );

      const firstStages = sorted[0]?.stages || null;
      const latestStages = sorted[sorted.length - 1]?.stages || null;

      const get = (s, k) => (s && s[k] ? s[k] : null);

      const rows = [
        ["Knowledge", get(firstStages, "knowledge"), get(latestStages, "knowledge")],
        ["Understanding", get(firstStages, "understanding"), get(latestStages, "understanding")],
        ["Communication", get(firstStages, "communication"), get(latestStages, "communication")],
        ["Professional Behaviour", get(firstStages, "professional_behaviour"), get(latestStages, "professional_behaviour")],
      ].map(([area, first, latest]) => {
        const f = titleCaseStage(first);
        const l = titleCaseStage(latest);
        return [area, f, l, arrowForMovement(f, l)];
      });

      return rows;
    }

    return empty;
  }, [report]);

  // Small helper to render bullets safely
  const BulletList = ({ items }) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <ul className="list-disc pl-6 text-[#cbc1e4] space-y-2">
        {items.map((x, idx) => (
          <li key={idx}>{String(x)}</li>
        ))}
      </ul>
    );
  };

  // PDF footer page numbers
  const addPageNumbers = (doc) => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${pageCount}`, w / 2, h - 20, { align: "center" });
    }
  };

  const handleDownload = async () => {
    if (!report || !headerMeta) return;
    setDownloading(true);

    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 40;
      let cursorY = 54;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Jetking Career Readiness Report", pageWidth / 2, cursorY, {
        align: "center",
      });
      cursorY += 18;

      // Meta row: Candidate Name | Session No | Course | Center
      autoTable(doc, {
        startY: cursorY,
        head: [["Candidate Name", "Session No", "Course", "Center"]],
        body: [
          [
            headerMeta.candidate_name,
            String(headerMeta.session_no ?? "N/A"),
            headerMeta.course,
            headerMeta.center,
          ],
        ],
        theme: "grid",
        styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: RED, textColor: 255, halign: "left" },
        margin: { left: marginX, right: marginX },
      });

      cursorY = doc.lastAutoTable.finalY + 18;

      // Section A — Career Readiness Summary
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

      // Stage legend (small)
      const legend =
        report.stage_legend && typeof report.stage_legend === "object"
          ? report.stage_legend
          : {};

      const legendRows = Object.keys(legend).length
        ? Object.entries(legend).map(([k, v]) => [
          titleCaseStage(k),
          String(v),
        ])
        : [
          ["Starting", "Beginning the journey — building foundational awareness"],
          ["Learning", "Gaining knowledge — starting to apply concepts"],
          ["Improving", "Making progress — developing consistency"],
          ["Ready", "Well-prepared — demonstrating competence"],
          ["Confident", "Fully equipped — ready for professional challenges"],
        ];

      autoTable(doc, {
        startY: cursorY,
        head: [["Stage", "Meaning"]],
        body: legendRows,
        theme: "grid",
        styles: { font: "helvetica", fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [240, 240, 240], textColor: 30, halign: "left" },
        margin: { left: marginX, right: marginX },
      });

      cursorY = doc.lastAutoTable.finalY + 16;

      // Section B — Progress
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

      // Professional Behaviour summary (1 line only)
      const pb = report?.career_readiness?.professional_behaviour_summary;
      if (pb) {
        autoTable(doc, {
          startY: cursorY,
          head: [["Professional Behaviour Summary"]],
          body: [[String(pb)]],
          theme: "grid",
          styles: { font: "helvetica", fontSize: 10, cellPadding: 6 },
          headStyles: { fillColor: [245, 245, 245], textColor: 30, halign: "left" },
          margin: { left: marginX, right: marginX },
        });
        cursorY = doc.lastAutoTable.finalY + 14;
      }

      // Bullets sections
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

      addBullets("Section C — What You Did Well.", report.career_readiness?.what_you_did_well);
      addBullets("Section D — What To Practice Next.", report.career_readiness?.what_to_practice_next);
      addBullets("Section E — Tips For Next Interview.", report.career_readiness?.tips_for_next_interview);

      addPageNumbers(doc);

      const safeName = (report.student_name || "candidate")
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");
      doc.save(`career-readiness-${safeName}-${id}.pdf`);
    } catch {
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (error && !loading) {
    return (
      <div className="p-6 text-center text-red-500">
        {error || "Report not found."}
      </div>
    );
  }

  return (
  <div className="bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] min-h-screen py-10 flex flex-col items-center relative">

    {/* Loader */}
    {loading && (
      <div className="flex justify-center items-center absolute inset-0 bg-[#09070f]/70 backdrop-blur-sm z-50">
        <div className="border-t-4 border-b-4 border-[#8d73ea] w-16 h-16 rounded-full animate-spin"></div>
      </div>
    )}

    {!loading && report && headerMeta && (
      <>
        <div
          id="report-content"
          className="max-w-4xl w-full bg-[#191426]/95 rounded-2xl shadow-[0_20px_52px_rgba(3,2,8,0.48)] border border-[#3b3052] p-8"
        >

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#f5f1ff]">
              Jetking Career Readiness Report
            </h2>
            <p className="text-sm text-[#9f8bc8] mt-1">
              A progress-focused report to help you become job-ready.
            </p>
          </div>

          {/* Candidate Details */}
          <div className="border border-[#3b3052] rounded-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-[#2a2140] to-[#8d73ea] text-white px-4 py-2 font-semibold">
              Candidate Details
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 text-sm">
              {[
                ["Candidate Name", headerMeta.candidate_name],
                ["Session No", String(headerMeta.session_no ?? "N/A")],
                ["Course", headerMeta.course],
                ["Center", headerMeta.center],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-[#9f8bc8]">{label}</div>
                  <div className="font-semibold text-[#f5f1ff]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage Description */}
          <div className="mt-3 p-4 bg-[#191427] border border-[#3b3052] rounded-xl">
            <div className="text-sm font-bold text-[#f5f1ff] mb-2">
              Stage Descriptions:
            </div>

            <div className="grid gap-2 text-sm text-[#b9b0d2]">
              {Object.keys(report.stage_legend || {}).length > 0
                ? Object.entries(report.stage_legend).map(([k, v]) => (
                    <div key={k}>
                      <span className="font-semibold text-[#c7b6ff]">
                        {titleCaseStage(k)}:
                      </span>{" "}
                      {String(v)}
                    </div>
                  ))
                : (
                  <>
                    <div><span className="font-semibold">Starting:</span> Beginning the journey</div>
                    <div><span className="font-semibold">Learning:</span> Starting to apply concepts</div>
                    <div><span className="font-semibold">Improving:</span> Building consistency</div>
                    <div><span className="font-semibold">Ready:</span> Demonstrating competence</div>
                    <div><span className="font-semibold">Confident:</span> Ready for professional challenges</div>
                  </>
                )}
            </div>
          </div>

          {/* Section A */}
          <div className="mt-6 mb-6">
            <h3 className="text-lg font-semibold text-[#f5f1ff] mb-2">
              Section A — Career Readiness Summary
            </h3>

            <table className="w-full border border-[#3b3052] border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-[#221a34] text-[#f5f1ff]">
                  <th className="px-4 py-2 text-left">Area</th>
                  <th className="px-4 py-2 text-left">Current Stage</th>
                </tr>
              </thead>
              <tbody>
                {sectionA.map(([area, stage]) => (
                  <tr key={area} className="hover:bg-[#191427]">
                    <td className="px-4 py-2 font-medium border-t border-[#2e2642]">{area}</td>
                    <td className="px-4 py-2 border-t border-[#2e2642]">{stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section B */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-[#f5f1ff] mb-2">
              Section B — Your Progress So Far
            </h3>

            <table className="w-full border border-[#3b3052] border-collapse">
              <thead>
                <tr className="bg-[#221a34] text-[#f5f1ff]">
                  <th className="px-4 py-2 text-left">Area</th>
                  <th className="px-4 py-2 text-left">First Session</th>
                  <th className="px-4 py-2 text-left">Latest Session</th>
                  <th className="px-4 py-2 text-left">Movement</th>
                </tr>
              </thead>
              <tbody>
                {sectionB.map(([area, first, latest, move]) => (
                  <tr key={area} className="hover:bg-[#191427]">
                    <td className="px-4 py-2 border-t border-[#2e2642] font-medium">{area}</td>
                    <td className="px-4 py-2 border-t border-[#2e2642]">{first}</td>
                    <td className="px-4 py-2 border-t border-[#2e2642]">{latest}</td>
                    <td className="px-4 py-2 border-t border-[#2e2642] font-semibold text-[#c7b6ff]">
                      {move}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          {report?.career_readiness?.professional_behaviour_summary && (
            <div className="mb-6 border border-[#3b3052] rounded-xl p-4 bg-[#191427]">
              <div className="text-sm font-semibold text-[#f5f1ff] mb-1">
                Professional Behaviour (Summary)
              </div>
              <div className="text-sm text-[#b9b0d2]">
                {String(report.career_readiness.professional_behaviour_summary)}
              </div>
            </div>
          )}

          {/* Sections C/D/E */}
          {[
            ["Section C — What You Did Well", report.career_readiness?.what_you_did_well],
            ["Section D — What To Practice Next", report.career_readiness?.what_to_practice_next],
            ["Section E — Tips For the Next Interview", report.career_readiness?.tips_for_next_interview],
          ].map(([title, items]) => (
            <div key={title} className="mb-6">
              <h3 className="text-lg font-semibold text-[#f5f1ff] mb-2">
                {title}
              </h3>
              <BulletList items={items} />
            </div>
          ))}

        </div>

        {/* Buttons */}
        <div className="max-w-4xl w-full mt-6 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-[#221a34] text-[#b9b0d2] rounded-xl hover:bg-[#302647] border border-[#483b63] cursor-pointer"
          >
            ⬅ Back to Reports
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-4 py-2 bg-[#8d73ea] text-white rounded-xl hover:bg-[#a88fff] cursor-pointer disabled:opacity-60"
          >
            {downloading ? "Generating..." : "⬇ Download Report"}
          </button>
        </div>
      </>
    )}
  </div>
);
}