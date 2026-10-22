import React from "react";
import { BarChart3 } from "lucide-react";
import { usePODashboard } from "../hooks/usePODashboard";

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("en-IN");
};

const formatScore = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `${Number(value).toFixed(1)}%`;
};

const getStageClass = (stage) => {
  const normalized = String(stage || "").toLowerCase();

  if (normalized === "ready" || normalized === "confident") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (normalized === "improving") {
    return "bg-[#FFF8D6] text-[#8A6D1F] border-[#E8D97A]";
  }

  if (normalized === "learning" || normalized === "starting") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  return "bg-[#221a34] text-[#b9b0d2] border-[#3b3052]";
};

const SkeletonBlock = ({ className = "" }) => {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-[#120d1f] via-[#2a2140] to-[#302647] ${className}`}
    />
  );
};

const KpiCardSkeleton = () => {
  return (
    <div className="text-center">
      <SkeletonBlock className="mx-auto h-4 w-28" />
      <SkeletonBlock className="mx-auto mt-3 h-8 w-20" />
      <SkeletonBlock className="mx-auto mt-2 h-3 w-40" />
    </div>
  );
};

const KpiCard = ({ title, value, subtitle, loading = false }) => {
  return (
    <div className="rounded-2xl border border-[#3b3052] bg-[#191426]/95 p-5 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
      <div className="flex items-center justify-center gap-4">
        {loading ? (
          <KpiCardSkeleton />
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-[#9f8bc8]">{title}</p>

            <h2 className="mt-2 text-2xl font-bold text-[#f5f1ff]">
              {value}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs text-[#b9b0d2]">{subtitle}</p>
            )}
          </div>
        )}

        {/* <div className="rounded-xl bg-[#221a34] p-3">
          <Icon className="h-5 w-5 text-[#b9b0d2]" />
        </div> */}
      </div>
    </div>
  );
};

const FilterBar = ({
  filters,
  filterOptions,
  onFilterChange,
  onReset,
  title,
  showCenterFilter = true,
}) => {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <h2 className="text-xl font-semibold text-[#f5f1ff]">{title}</h2>

      {/* <div className="flex flex-col gap-3 sm:flex-row">
        {showCenterFilter && (
          <select
            value={filters.center}
            onChange={(e) => onFilterChange("center", e.target.value)}
            className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-2 text-sm text-[#f5f1ff] outline-none focus:ring-2 focus:ring-[#b89cff]"
          >
            <option value="">All Centers</option>
            {filterOptions.centers.map((center) => (
              <option key={center} value={center}>
                {center}
              </option>
            ))}
          </select>
        )}

        <select
          value={filters.course}
          onChange={(e) => onFilterChange("course", e.target.value)}
          className="rounded-xl border border-[#483b63] bg-[#191427] px-4 py-2 text-sm text-[#f5f1ff] outline-none focus:ring-2 focus:ring-[#b89cff]"
        >
          <option value="">All Courses</option>
          {filterOptions.courses.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <button
          onClick={onReset}
          className="rounded-xl border border-[#483b63] bg-[#221a34] px-4 py-2 text-sm font-medium text-[#b9b0d2] transition hover:bg-[#302647] cursor-pointer"
        >
          Reset
        </button>
      </div> */}
    </div>
  );
};

const PaginationButtons = ({ previous, next, onPrevious, onNext, loading }) => {
  return (
    <div className="mt-4 flex items-center justify-end gap-3">
      <button
        onClick={onPrevious}
        disabled={!previous || loading}
        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
          previous && !loading
            ? "bg-[#221a34] text-[#b9b0d2] hover:bg-[#302647] cursor-pointer"
            : "bg-[#3a3052] text-[#9487b8] cursor-not-allowed"
        }`}
      >
        Previous
      </button>

      <button
        onClick={onNext}
        disabled={!next || loading}
        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
          next && !loading
            ? "bg-[#8d73ea] text-white hover:bg-[#a88fff] cursor-pointer"
            : "bg-[#3a3052] text-[#9487b8] cursor-not-allowed"
        }`}
      >
        Next
      </button>
    </div>
  );
};

const DistributionSkeleton = ({ rows = 5 }) => {
  return (
    <div className="mt-5 space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index}>
          <div className="mb-2 flex justify-between gap-4">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
          <SkeletonBlock className="h-3 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
};

const SectionSkeleton = ({ rows = 5 }) => {
  return (
    <div className="mt-5 space-y-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index}>
          <div className="mb-2 flex justify-between">
            <div className="h-4 w-28 rounded bg-[#221a34] animate-pulse" />
            <div className="h-4 w-20 rounded bg-[#221a34] animate-pulse" />
          </div>

          <div className="h-3 w-full rounded-full bg-[#221a34] animate-pulse" />
        </div>
      ))}
    </div>
  );
};

const ReadinessDistribution = ({ data, loading = false }) => {
  const stages = [
    { key: "confident", label: "Confident" },
    { key: "ready", label: "Ready" },
    { key: "improving", label: "Improving" },
    { key: "learning", label: "Learning" },
    { key: "starting", label: "Starting" },
  ];

  const total = stages.reduce(
    (sum, stage) => sum + Number(data?.[stage.key] || 0),
    0
  );

  return (
    <div className="rounded-2xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
      <h2 className="text-xl font-semibold text-[#f5f1ff]">
        Placement Readiness
      </h2>

      {loading ? (
        <SectionSkeleton rows={5} />
      ) : (
        <div className="mt-5 space-y-4">
          {stages.map((stage) => {
            const count = Number(data?.[stage.key] || 0);

            // Used only for bar width
            const widthPercent = total ? (count / total) * 100 : 0;

            return (
              <div key={stage.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[#b9b0d2]">
                    {stage.label}
                  </span>

                  {/* Display count only, no percentage */}
                  <span className="text-[#f5f1ff] font-medium">
                    {formatNumber(count)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#221a34]">
                  <div
                    className="h-full rounded-full bg-[#b89cff] transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            );
          })}

          <div className="pt-2 text-xs text-[#9f8bc8]">
            Total students counted:{" "}
            <span className="font-semibold text-[#b9b0d2]">
              {formatNumber(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const SkillDistribution = ({ data, loading = false }) => {
  const skills = [
    { key: "technical", label: "Technical" },
    { key: "communication", label: "Communication" },
    { key: "problem_solving", label: "Problem Solving" },
    { key: "time_mgmt", label: "Time Management" },
  ];

  return (
    <div className="rounded-2xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
      <h2 className="text-xl font-semibold text-[#f5f1ff]">
        Skill Distribution
      </h2>

      {loading ? (
        <DistributionSkeleton rows={4} />
      ) : (
        <div className="mt-5 space-y-4">
          {skills.map((skill) => {
            const score = Number(data?.[skill.key] || 0);

            return (
              <div key={skill.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[#b9b0d2]">
                    {skill.label}
                  </span>
                  <span className="text-[#f5f1ff]">{score.toFixed(1)}%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#221a34]">
                  <div
                    className="h-full rounded-full bg-[#8d73ea]"
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const RecommendedActions = ({ actions, loading = false }) => {
  return (
    <div className="mt-6 rounded-2xl border border-[#3b3052] bg-[#191426]/95 p-6 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-[#221a34] p-3">
          <BarChart3 className="h-5 w-5 text-[#b9b0d2]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#f5f1ff]">
            Recommended Actions
          </h2>
          <p className="text-sm text-[#b9b0d2]">
            System-generated placement guidance based on student performance.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#3b3052] bg-[#191427] p-4"
            >
              <SkeletonBlock className="h-4 w-11/12" />
              <SkeletonBlock className="mt-2 h-4 w-3/4" />
              <SkeletonBlock className="mt-2 h-4 w-5/6" />
            </div>
          ))}
        </div>
      ) : actions.length === 0 ? (
        <p className="text-sm text-[#b9b0d2]">
          No recommended actions available.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className="rounded-xl border border-[#3b3052] bg-[#191427] p-4 text-sm text-[#b9b0d2]"
            >
              {action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReadyStudentsTable = ({ students, loading }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#3b3052] bg-[#191426]/95 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
      <div className="max-h-[420px] overflow-auto">
        <table className="min-w-[900px] w-full text-sm">
          <thead className="sticky top-0 bg-gradient-to-r from-[#2a2140] to-[#8d73ea] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Student ID</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Course</th>
              <th className="px-4 py-3 text-left font-semibold">Center</th>
              <th className="px-4 py-3 text-left font-semibold">
                Overall Score
              </th>
              <th className="px-4 py-3 text-left font-semibold">Readiness</th>
              <th className="px-4 py-3 text-left font-semibold">
                Latest Interview
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[#b9b0d2]"
                >
                  Loading placement-ready students...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-[#b9b0d2]"
                >
                  No placement-ready students found.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr
                  key={`${student.student_id}-${index}`}
                  className={`${
                    index % 2 === 0 ? "bg-[#1b1527]" : "bg-[#261d39]"
                  } hover:bg-[#0f0b19] transition`}
                >
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.student_id || "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#f5f1ff]">
                    {student.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.course_name || "-"}
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.center || "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#f5f1ff]">
                    {student.overall_score ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStageClass(
                        student.readiness_stage,
                      )}`}
                    >
                      {student.readiness_stage || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.latest_interview_date || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AttentionStudentsTable = ({ students, loading }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#3b3052] bg-[#191426]/95 shadow-[0_18px_48px_rgba(3,2,8,0.45)]">
      <div className="max-h-[460px] overflow-auto">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="sticky top-0 bg-gradient-to-r from-[#2a2140] to-[#8d73ea] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Student ID</th>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Course</th>
              <th className="px-4 py-3 text-left font-semibold">Center</th>
              <th className="px-4 py-3 text-left font-semibold">Overall</th>
              <th className="px-4 py-3 text-left font-semibold">
                Communication
              </th>
              <th className="px-4 py-3 text-left font-semibold">Reason</th>
              <th className="px-4 py-3 text-left font-semibold">
                Recommended Action
              </th>
              <th className="px-4 py-3 text-left font-semibold">
                Latest Interview
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-[#b9b0d2]"
                >
                  Loading students needing attention...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-4 py-10 text-center text-[#b9b0d2]"
                >
                  No students needing attention found.
                </td>
              </tr>
            ) : (
              students.map((student, index) => (
                <tr
                  key={`${student.student_id}-${student.email || index}-${index}`}
                  className={`${
                    index % 2 === 0 ? "bg-[#1b1527]" : "bg-[#261d39]"
                  } hover:bg-[#0f0b19] transition align-top`}
                >
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.student_id || "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#f5f1ff]">
                    {student.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.course_name || "-"}
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.center || "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#f5f1ff]">
                    {student.overall_score ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#f5f1ff]">
                    {student.communication_score ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-[#B42318]">
                    {student.reason || "-"}
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.recommended_action || "-"}
                  </td>
                  <td className="px-4 py-3 text-[#b9b0d2]">
                    {student.latest_interview_date || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PODashboard = ({
  showCenterFilter = false,
  pageTitle = "Placement Officer Dashboard",
}) => {
  const {
    kpis,

    readyStudents,
    attentionStudents,

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

    refreshDashboard,
  } = usePODashboard();

  const overview = kpis?.overview || {};
  const placementReadiness = kpis?.placement_readiness || {};
  const skillDistribution = kpis?.skill_distribution || {};
  const recommendedActions = Array.isArray(kpis?.recommended_actions)
    ? kpis.recommended_actions
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0915] via-[#161022] to-[#241938] p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f1ff]">{pageTitle}</h1>
            <p className="mt-2 text-sm text-[#b9b0d2]">
              Track placement readiness, interview performance, and students who
              need placement support.
            </p>
          </div>

          {/* <button
            onClick={refreshDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8d73ea] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88fff] cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button> */}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-[#191427] px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            title="Total Students"
            value={formatNumber(overview.total_students)}
            subtitle="Students available for placement tracking"
            loading={loadingKpis}
          />

          <KpiCard
            title="Completed Interviews"
            value={formatNumber(overview.completed_interviews)}
            subtitle="Total completed interview attempts"
            loading={loadingKpis}
          />

          <KpiCard
            title="Avg Overall Score"
            value={formatScore(overview.avg_overall_score)}
            subtitle="Average interview performance"
            loading={loadingKpis}
          />

          <KpiCard
            title="Placement Ready"
            value={formatNumber(overview.placement_ready_students)}
            subtitle="Students ready for placement"
            loading={loadingKpis}
          />

          <KpiCard
            title="Invalid Interviews"
            value={formatNumber(overview.invalid_interviews)}
            subtitle="Needs review or correction"
            loading={loadingKpis}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ReadinessDistribution
            data={placementReadiness}
            loading={loadingKpis}
          />
          <SkillDistribution data={skillDistribution} loading={loadingKpis} />
        </div>

        <RecommendedActions
          actions={recommendedActions}
          loading={loadingKpis}
        />

        <div className="mt-8">
          <FilterBar
            title="Placement Ready Students"
            filters={readyFilters}
            filterOptions={readyFilterOptions}
            onFilterChange={handleReadyFilterChange}
            onReset={resetReadyFilters}
            showCenterFilter={showCenterFilter}
          />

          <ReadyStudentsTable
            students={readyStudents}
            loading={loadingReadyStudents}
          />

          <PaginationButtons
            previous={readyPagination.previous}
            next={readyPagination.next}
            onPrevious={handleReadyPrevious}
            onNext={handleReadyNext}
            loading={loadingReadyStudents}
          />
        </div>

        <div className="mt-10">
          <FilterBar
            title="Students Needing Attention"
            filters={attentionFilters}
            filterOptions={attentionFilterOptions}
            onFilterChange={handleAttentionFilterChange}
            onReset={resetAttentionFilters}
            showCenterFilter={showCenterFilter}
          />

          <AttentionStudentsTable
            students={attentionStudents}
            loading={loadingAttentionStudents}
          />

          <PaginationButtons
            previous={attentionPagination.previous}
            next={attentionPagination.next}
            onPrevious={handleAttentionPrevious}
            onNext={handleAttentionNext}
            loading={loadingAttentionStudents}
          />
        </div>
      </div>
    </div>
  );
};

export default PODashboard;
