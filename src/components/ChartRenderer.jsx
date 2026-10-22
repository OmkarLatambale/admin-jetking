import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
);

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value || 0));

const getTotalCount = (items = [], key = "count") =>
  items.reduce((sum, item) => sum + Number(item?.[key] || 0), 0);

const getMaxCount = (items = [], key = "count") => {
  if (!items.length) return 0;
  return Math.max(...items.map((item) => Number(item?.[key] || 0)));
};

const getPercentage = (value, total) => {
  if (!total) return 0;
  return (Number(value || 0) / Number(total || 0)) * 100;
};

const getDifficultyBarColor = (difficultyLevel = "") => {
  const difficulty = difficultyLevel.toLowerCase();

  if (difficulty === "beginner") return "bg-[#8d73ea]";
  if (difficulty === "medium") return "bg-[#b89cff]";
  if (difficulty === "advanced") return "bg-[#c9b7ff]";

  return "bg-[#b89cff]";
};

const centerColors = [
  "bg-[#8d73ea]",
  "bg-[#b89cff]",
  "bg-[#a88fff]",
  "bg-[#c9b7ff]",
];

const linePointValuePlugin = {
  id: "linePointValuePlugin",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    ctx.save();
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillStyle = "#ece6ff";
    ctx.textAlign = "center";

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);

      meta.data.forEach((point, index) => {
        const value = dataset.data[index];
        if (value === null || value === undefined) return;

        const { x, y } = point.getProps(["x", "y"], true);
        ctx.fillText(value, x, y - 10);
      });
    });

    ctx.restore();
  },
};

const buildLineDailyData = (dailyInterviewCount = []) => {
  const sortedDailyInterviews = [...dailyInterviewCount].reverse();

  return {
    labels: sortedDailyInterviews.map((d) => d.date),
    datasets: [
      {
        label: "Interviews",
        data: sortedDailyInterviews.map((d) => d.count),
        borderWidth: 3,
        borderColor: "#b89cff",
        backgroundColor: "#b89cff",
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "#cebaff",
        pointBorderColor: "#120d1f",
        pointBorderWidth: 2,
        fill: false,
        tension: 0.3,
      },
    ],
  };
};

const ChartRenderer = ({ analytics, hideTopCenters = false }) => {
  if (!analytics) return null;

  const statusDistribution = analytics.status_distribution || [];
  const difficultyDistribution = analytics.difficulty_distribution || [];
  const topCenters = analytics.top_centers || [];
  const dailyInterviewCount = analytics.daily_interview_count || [];

  const totalInterviews = getTotalCount(statusDistribution, "count");
  const totalDifficulty = getTotalCount(difficultyDistribution, "count");
  const maxCenterCount = getMaxCount(topCenters, "student_count");
  const lineDaily = buildLineDailyData(dailyInterviewCount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Interview Status KPI Cards */}
      <div className="bg-[#191426] rounded-2xl border border-[#3b3052] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-2xl font-semibold text-[#f5f1ff]">
              Interview Status
            </h3>
            <p className="text-sm font-bold text-[#cbc1e4] mt-1">
              Total Interviews: {formatNumber(totalInterviews)}
            </p>
          </div>

          <div className="px-4 py-2 rounded-xl bg-[#221a34] text-[#b9b0d2] text-sm font-semibold border border-[#3b3052]">
            Summary
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statusDistribution.map((item) => {
            const isCompleted = item.status?.toLowerCase() === "completed";
            const cardClasses = isCompleted
              ? "bg-gradient-to-br from-[#221a34] via-[#1d172c] to-[#1a1427] border-[#6f58c9]/45 "
              : "bg-[#221a34] border-[#4a3c69]";
            const labelClasses = isCompleted
              ? "text-[#c9b7ff]"
              : "text-[#b9b0d2]";
            const badgeClasses = isCompleted
              ? "bg-[#c9b7ff]/16 text-[#efe7ff] border border-[#8d73ea]/35"
              : "bg-[#302647] text-[#b9b0d2]";
            const trackClasses = isCompleted ? "bg-[#161022]" : "bg-[#1b1527]";
            const fillClasses = isCompleted ? "bg-[#c9b7ff]" : "bg-[#a88fff]";

            return (
              <div
                key={item.status}
                className={`rounded-2xl p-5 border transition-all ${cardClasses}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-sm font-semibold capitalize ${labelClasses}`}>
                    {item.status}
                  </p>

                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClasses}`}>
                    {Number(item.percentage || 0).toFixed(2)}%
                  </span>
                </div>

                <h4 className="text-4xl font-bold tracking-tight text-[#f5f1ff]">
                  {formatNumber(item.count)}
                </h4>

                <div className={`mt-6 h-3 rounded-full overflow-hidden ${trackClasses}`}>
                  <div
                    className={`h-full rounded-full ${fillClasses}`}
                    style={{ width: `${item.percentage || 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty Level Distribution */}
      <div className="bg-[#191426]/95 rounded-2xl shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] p-5">
        <h3 className="text-2xl font-semibold text-center mb-4 text-[#f5f1ff]">
          Difficulty Level Distribution
        </h3>

        <div className="space-y-4">
          {difficultyDistribution.map((item) => {
            const percentage = getPercentage(item.count, totalDifficulty);
            const barColor = getDifficultyBarColor(item.difficulty_level);

            return (
              <div key={item.difficulty_level}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-[#f5f1ff] capitalize">
                    {item.difficulty_level}
                  </p>

                  <p className="text-sm font-bold text-[#b9b0d2]">
                    {formatNumber(item.count)}
                  </p>
                </div>

                <div className="h-4 bg-[#221a34] rounded-full overflow-hidden border border-[#3b3052]">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-xs text-[#9487b8] mt-1">
                  {percentage.toFixed(1)}% of total students
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Centers by Student Count */}
      {!hideTopCenters && (
        <div className="bg-[#191426]/95 rounded-2xl shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] p-5">
          <h3 className="text-2xl font-semibold text-center mb-4 text-[#f5f1ff]">
            Top Centers by Student Count
          </h3>

          <div className="space-y-4">
            {topCenters.map((center, index) => {
              const percentage = getPercentage(
                center.student_count,
                maxCenterCount,
              );

              return (
                <div key={center.center_fk__name || index}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-[#f5f1ff]">
                      {center.center_fk__name || "Unknown"}
                    </p>

                    <p className="text-sm font-bold text-[#b9b0d2]">
                      {formatNumber(center.student_count)}
                    </p>
                  </div>

                  <div className="h-4 bg-[#221a34] rounded-full overflow-hidden border border-[#3b3052]">
                    <div
                      className={`h-full rounded-full ${
                        centerColors[index % centerColors.length]
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Interview Count */}
      <div className="bg-[#191426]/95 rounded-2xl shadow-[0_18px_48px_rgba(3,2,8,0.45)] border border-[#3b3052] p-5">
        <h3 className="text-2xl font-semibold text-center mb-4 text-[#f5f1ff]">
          Daily Interview Count
        </h3>

        <div className="overflow-x-auto">
          <div
            className="h-72"
            style={{
              minWidth: `${lineDaily?.labels?.length * 90}px`,
            }}
          >
            <Line
              data={lineDaily}
              plugins={[linePointValuePlugin]}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                layout: {
                  padding: {
                    top: 35,
                    right: 25,
                    left: 10,
                  },
                },
                scales: {
                  x: {
                    ticks: {
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 45,
                      color: "#b9b0d2",
                    },
                    grid: {
                      display: false,
                    },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                      color: "#b9b0d2",
                    },
                    grid: {
                      color: "#3b3052",
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    enabled: true,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartRenderer;
