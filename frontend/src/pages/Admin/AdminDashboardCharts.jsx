import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const monthLabel = (m) => `Th${m}`;

const AdminDashboardCharts = ({ revenueData = [], usersByRole = [], tutorsByStatus = [] }) => {
  // Build 12-month line chart, fill zeros for missing months
  const revenueChart = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const map = new Map();
    (revenueData || []).forEach((d) => {
      const m = d?._id?.month;
      const total = d?.totalRevenue || 0;
      if (m) map.set(m, total);
    });
    const labels = months.map((m) => monthLabel(m));
    const data = months.map((m) => map.get(m) || 0);
    return {
      labels,
      datasets: [
        {
          label: "Doanh thu",
          data,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59,130,246,0.15)",
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [revenueData]);

  const doughnutUsers = useMemo(() => {
    const labels = (usersByRole || []).map((d) => d._id || "Khác");
    const data = (usersByRole || []).map((d) => d.count || 0);
    const palette = ["#60a5fa", "#34d399", "#f59e0b", "#a78bfa", "#f87171"]; 
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [usersByRole]);

  const doughnutTutors = useMemo(() => {
    const pretty = (s) => {
      if (s === "pending") return "Chờ duyệt";
      if (s === "approved") return "Đã duyệt";
      if (s === "rejected") return "Đã từ chối";
      if (s === "draft") return "Nháp";
      return s || "Khác";
    };
    const labels = (tutorsByStatus || []).map((d) => pretty(d._id));
    const data = (tutorsByStatus || []).map((d) => d.count || 0);
    const palette = ["#f59e0b", "#10b981", "#ef4444", "#6366f1", "#94a3b8"]; 
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => palette[i % palette.length]),
          borderWidth: 0,
        },
      ],
    };
  }, [tutorsByStatus]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#eef2ff" } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  return (
    <div className="admin-charts">
      <div className="admin-chart-card" style={{ minHeight: 340 }}>
        <div className="admin-chart-header">
          <h3 className="admin-chart-title">Thống kê doanh thu theo tháng</h3>
        </div>
        <div style={{ height: 280 }}>
          <Line data={revenueChart} options={lineOptions} />
        </div>
      </div>

      <div className="admin-chart-card" style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 16 }}>
        <div>
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">Người dùng theo vai trò</h3>
          </div>
          <div style={{ height: 220 }}>
            <Doughnut data={doughnutUsers} options={doughnutOptions} />
          </div>
        </div>
        <div>
          <div className="admin-chart-header">
            <h3 className="admin-chart-title">Hồ sơ gia sư theo trạng thái</h3>
          </div>
          <div style={{ height: 220 }}>
            <Doughnut data={doughnutTutors} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardCharts;
