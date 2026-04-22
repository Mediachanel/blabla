"use client";

import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function DashboardChartCard({ title, type = "bar", labels = [], values = [] }) {
  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: ["#155f8c", "#2694cc", "#88cbed", "#ffd86b", "#d89b17", "#94a3b8"],
        borderRadius: type === "bar" ? 8 : 0
      }
    ]
  };

  return (
    <article className="surface p-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 h-72">
        {type === "doughnut" ? (
          <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
        ) : (
          <Bar data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        )}
      </div>
    </article>
  );
}
