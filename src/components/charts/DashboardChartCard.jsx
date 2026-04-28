"use client";

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { useRef } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const defaultColors = ["#18a8e0", "#13a8be", "#22c55e", "#14b8a6", "#10b981", "#8b5cf6", "#f97316", "#ef4444"];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("id-ID");
}

function formatPercent(value, total) {
  const number = Number(value || 0);
  const denominator = Number(total || 0);
  if (!denominator) return "0%";
  return `${((number / denominator) * 100).toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
}

function getVisibleDatasets(chart) {
  return chart.data.datasets
    .map((dataset, datasetIndex) => ({ dataset, datasetIndex }))
    .filter(({ datasetIndex }) => chart.isDatasetVisible(datasetIndex));
}

function getStackTotal(chart, dataIndex) {
  return getVisibleDatasets(chart).reduce((sum, { dataset }) => sum + Number(dataset.data?.[dataIndex] || 0), 0);
}

function drawText(ctx, text, x, y, { color = "#334155", align = "center", baseline = "middle", font = "600 10px Inter, Arial, sans-serif", stroke = true, strokeColor = "rgba(255,255,255,0.92)" } = {}) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (stroke) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = strokeColor;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

const valueLabelsPlugin = {
  id: "dashboardValueLabels",
  afterDatasetsDraw(chart, _args, pluginOptions = {}) {
    if (pluginOptions.display === false) return;
    const { ctx, chartArea } = chart;
    const isDoughnut = chart.config.type === "doughnut";
    const horizontal = chart.options.indexAxis === "y";
    const stacked = Boolean(chart.options.scales?.x?.stacked || chart.options.scales?.y?.stacked);

    if (isDoughnut) {
      const dataset = chart.data.datasets[0];
      const values = dataset?.data || [];
      const total = values.reduce((sum, value, index) => {
        if (!chart.getDataVisibility(index)) return sum;
        return sum + Number(value || 0);
      }, 0);
      const meta = chart.getDatasetMeta(0);

      meta.data.forEach((arc, index) => {
        const value = Number(values[index] || 0);
        if (!chart.getDataVisibility(index)) return;
        if (!value || !total) return;

        const percent = (value / total) * 100;
        if (percent < 2.5) return;

        const { startAngle, endAngle, innerRadius, outerRadius, x, y } = arc.getProps(
          ["startAngle", "endAngle", "innerRadius", "outerRadius", "x", "y"],
          true
        );
        const angle = (startAngle + endAngle) / 2;
        const ringWidth = outerRadius - innerRadius;
        const labelRadius = innerRadius + ringWidth * (percent < 5 ? 0.72 : 0.56);
        const labelX = x + Math.cos(angle) * labelRadius;
        const labelY = y + Math.sin(angle) * labelRadius;
        const fontSize = percent < 5 ? 9 : percent < 10 ? 10 : 11;

        drawText(ctx, formatNumber(value), labelX, labelY, {
          color: "#0f172a",
          font: `500 ${fontSize}px Inter, Arial, sans-serif`,
          stroke: false
        });
      });

      const center = meta.data[0]?.getProps(["x", "y"], true);
      if (center && total) {
        drawText(ctx, "Total", center.x, center.y - 9, {
          color: "#64748b",
          font: "600 10px Inter, Arial, sans-serif",
          stroke: false
        });
        drawText(ctx, formatNumber(total), center.x, center.y + 7, {
          color: "#0f172a",
          font: "800 15px Inter, Arial, sans-serif",
          stroke: false
        });
      }
      return;
    }

    const visible = getVisibleDatasets(chart);
    const totals = chart.data.labels.map((_, dataIndex) => getStackTotal(chart, dataIndex));
    const maxTotal = Math.max(...totals, 0);

    if (stacked) {
      totals.forEach((total, dataIndex) => {
        if (!total) return;
        if (!horizontal && chart.data.labels.length > 20 && total < maxTotal * 0.16) return;

        const bars = visible
          .map(({ datasetIndex }) => chart.getDatasetMeta(datasetIndex).data[dataIndex])
          .filter(Boolean)
          .map((bar) => bar.getProps(["x", "y"], true));
        if (!bars.length) return;

        if (horizontal) {
          const right = Math.max(...bars.map((bar) => bar.x));
          const y = bars[0].y;
          if (right + 4 > chartArea.right + 46) return;
          drawText(ctx, formatNumber(total), right + 5, y, {
            align: "left",
            color: "#334155",
            font: "700 10px Inter, Arial, sans-serif"
          });
        } else {
          const top = Math.min(...bars.map((bar) => bar.y));
          const x = bars[0].x;
          if (top - 4 < chartArea.top - 2) return;
          drawText(ctx, formatNumber(total), x, top - 5, {
            baseline: "bottom",
            color: "#334155",
            font: "700 9px Inter, Arial, sans-serif"
          });
        }
      });
      return;
    }

    visible.forEach(({ dataset, datasetIndex }) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar, dataIndex) => {
        const value = Number(dataset.data?.[dataIndex] || 0);
        if (!value) return;
        const { x, y } = bar.getProps(["x", "y"], true);
        drawText(ctx, formatNumber(value), horizontal ? x + 5 : x, horizontal ? y : y - 5, {
          align: horizontal ? "left" : "center",
          baseline: horizontal ? "middle" : "bottom",
          color: "#334155",
          font: "700 10px Inter, Arial, sans-serif"
        });
      });
    });
  }
};

function getSummaryRows({ labels = [], values = [], colors = [], datasets = [] }) {
  const palette = colors?.length ? colors : defaultColors;
  const rows = datasets?.length
    ? labels.map((label, index) => ({
        label,
        value: datasets.reduce((sum, dataset) => sum + Number(dataset.data?.[index] || 0), 0),
        color: palette[index % palette.length]
      }))
    : labels.map((label, index) => ({
        label,
        value: Number(values[index] || 0),
        color: palette[index % palette.length]
      }));

  const visibleRows = rows.filter((row) => row.label && row.value > 0);
  const total = visibleRows.reduce((sum, row) => sum + row.value, 0);
  const sortedRows = visibleRows.length > 8
    ? [...visibleRows].sort((a, b) => b.value - a.value).slice(0, 8)
    : visibleRows;

  return sortedRows.map((row) => ({
    ...row,
    percent: total ? formatPercent(row.value, total) : ""
  }));
}

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
  const flatTotal = values.reduce((sum, value) => sum + Number(value || 0), 0);
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
  const summaryRows = getSummaryRows({ labels, values, colors, datasets });
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
          label: (context) => {
            const value = Number(context.raw || 0);
            const total = datasets?.length
              ? context.chart.data.datasets.reduce((sum, dataset) => sum + Number(dataset.data?.[context.dataIndex] || 0), 0)
              : flatTotal;
            const label = type === "doughnut" ? context.label : (context.dataset.label || context.label);
            return `${label}: ${formatNumber(value)} (${formatPercent(value, total)})`;
          }
        }
      }
    },
    layout: {
      padding: {
        top: type === "bar" ? 20 : 4,
        right: type === "bar" && horizontal ? 52 : 8
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
      <div className={`mt-4 ${heightClass}`} role="img" aria-label={`Grafik ${title}`}>
        {type === "doughnut" ? (
          <Doughnut
            ref={chartRef}
            data={data}
            options={{
              ...commonOptions,
              cutout: "55%",
              plugins: {
                ...commonOptions.plugins,
                legend: { ...commonOptions.plugins.legend, position: "bottom", align: "center" },
                tooltip: commonOptions.plugins.tooltip
              }
            }}
            plugins={[valueLabelsPlugin]}
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
            plugins={[valueLabelsPlugin]}
          />
        )}
      </div>
      {summaryRows.length ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
          {summaryRows.map((row) => (
            <div key={row.label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span>{row.label}</span>
              <span className="font-bold tabular-nums text-slate-900">
                {formatNumber(row.value)}{row.percent ? ` (${row.percent})` : ""}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
