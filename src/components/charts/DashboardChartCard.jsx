"use client";

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { useRef } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const defaultColors = ["#18a8e0", "#13a8be", "#22c55e", "#14b8a6", "#10b981", "#8b5cf6", "#f97316", "#ef4444"];

function downloadChart(chartRef, title) {
  const chart = chartRef.current;
  if (!chart) return;
  const link = document.createElement("a");
  link.href = chart.toBase64Image("image/png", 1);
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "chart"}.png`;
  link.click();
}

export default function DashboardChartCard({
  title,
  type = "bar",
  labels = [],
  values = [],
  colors,
  datasets,
  horizontal = false,
  stacked = false,
  heightClass = "h-72"
}) {
  const chartRef = useRef(null);
  const chartDatasets = datasets?.length
    ? datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: dataset.backgroundColor || defaultColors[index % defaultColors.length],
        borderColor: dataset.borderColor || dataset.backgroundColor || defaultColors[index % defaultColors.length],
        borderRadius: type === "bar" ? 2 : 0,
        maxBarThickness: horizontal ? 14 : 18,
        categoryPercentage: 0.9,
        barPercentage: 0.85
      }))
    : [
        {
          label: title,
          data: values,
          backgroundColor: colors?.length ? colors : defaultColors,
          borderRadius: type === "bar" ? 2 : 0,
          maxBarThickness: horizontal ? 14 : 18
        }
      ];
  const data = {
    labels,
    datasets: chartDatasets
  };
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: type === "doughnut" ? "bottom" : "top",
        align: "start",
        labels: {
          boxWidth: 11,
          boxHeight: 11,
          usePointStyle: true,
          pointStyle: "circle",
          color: "#475569",
          font: { size: 11 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label || context.label}: ${Number(context.raw || 0).toLocaleString("id-ID")}`
        }
      }
    }
  };

  return (
    <article className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={() => downloadChart(chartRef, title)} type="button">
          Unduh PNG
        </button>
      </div>
      <div className={`mt-4 ${heightClass}`}>
        {type === "doughnut" ? (
          <Doughnut
            ref={chartRef}
            data={data}
            options={{
              ...commonOptions,
              cutout: "55%",
              plugins: {
                ...commonOptions.plugins,
                legend: { ...commonOptions.plugins.legend, position: "bottom", align: "center" }
              }
            }}
          />
        ) : (
          <Bar
            ref={chartRef}
            data={data}
            options={{
              ...commonOptions,
              indexAxis: horizontal ? "y" : "x",
              scales: {
                x: {
                  stacked,
                  beginAtZero: true,
                  grid: { color: "#e5e7eb" },
                  ticks: { color: "#64748b", font: { size: 10 }, maxRotation: horizontal ? 0 : 55, minRotation: horizontal ? 0 : 55 }
                },
                y: {
                  stacked,
                  beginAtZero: true,
                  grid: { color: "#e5e7eb" },
                  ticks: { color: "#64748b", font: { size: 10 } }
                }
              }
            }}
          />
        )}
      </div>
    </article>
  );
}
