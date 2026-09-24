"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Download,
  Search,
  Bell,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

interface Reminder {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLicensePlate: string;
  batteryCategory: string;
  batteryModel: string | null;
  checkOrder: number;
  dueDate: string;
  isCompleted: boolean;
  status: string;
}

interface Stats {
  totalReminders: number;
  activeWarranties: number;
  expiredWarranties: number;
  completedChecks: number;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const CATEGORIES: Record<string, string> = {
  MF_ISS_LN: "MF/ISS/LN",
  CALCIUM: "Calcium",
  HYBRID: "Hybrid",
  OTHER: "Lainnya",
};

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReminders: 0,
    activeWarranties: 0,
    expiredWarranties: 0,
    completedChecks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      if (category) params.set("category", category);
      if (search) params.set("search", search);

      const res = await fetch(`/api/reminders?${params}`);
      const json = await res.json();

      if (res.ok) {
        setReminders(json.data || []);
        setStats(json.stats || { totalReminders: 0, activeWarranties: 0, expiredWarranties: 0, completedChecks: 0 });
      }
    } catch (err) {
      console.error("Error fetching reminders:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year, category, search]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/reminders/export?month=${month}&year=${year}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Reminder_${MONTHS[month - 1]}_${year}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error exporting:", err);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const currentYears = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--foreground)",
            marginBottom: "0.25rem",
          }}
        >
          Dashboard Reminder
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.925rem" }}>
          Pantau jadwal cek rutin pelanggan bulan {MONTHS[month - 1]} {year}
        </p>
      </div>

      {/* Filters */}
      <div
        className="card"
        style={{
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
        }}
      >
        <div className="form-group" style={{ minWidth: "150px" }}>
          <label className="form-label">Bulan</label>
          <select
            className="form-select"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: "110px" }}>
          <label className="form-label">Tahun</label>
          <select
            className="form-select"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {currentYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: "150px" }}>
          <label className="form-label">Kategori Aki</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1, minWidth: "200px" }}>
          <label className="form-label">Cari</label>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted-light)",
              }}
            />
            <input
              className="form-input"
              style={{ paddingLeft: "2.25rem" }}
              placeholder="Nama atau No Plat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={exporting || reminders.length === 0}
          style={{ height: "42px" }}
        >
          <Download size={16} />
          {exporting ? "Mengunduh..." : "Download Excel"}
        </button>
      </div>

      {/* Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="metric-card">
          <div
            className="icon-wrapper"
            style={{ background: "var(--primary-light)" }}
          >
            <Bell size={22} color="var(--primary)" />
          </div>
          <div>
            <div className="metric-value">{stats.totalReminders}</div>
            <div className="metric-label">Total Reminder</div>
          </div>
        </div>

        <div className="metric-card">
          <div
            className="icon-wrapper"
            style={{ background: "var(--secondary-light)" }}
          >
            <ShieldCheck size={22} color="var(--secondary)" />
          </div>
          <div>
            <div className="metric-value">{stats.activeWarranties}</div>
            <div className="metric-label">Garansi Aktif</div>
          </div>
        </div>

        <div className="metric-card">
          <div
            className="icon-wrapper"
            style={{ background: "var(--danger-light)" }}
          >
            <ShieldAlert size={22} color="var(--danger)" />
          </div>
          <div>
            <div className="metric-value">{stats.expiredWarranties}</div>
            <div className="metric-label">Garansi Expired</div>
          </div>
        </div>

        <div className="metric-card">
          <div
            className="icon-wrapper"
            style={{ background: "var(--accent-light)" }}
          >
            <CheckCircle2 size={22} color="var(--accent)" />
          </div>
          <div>
            <div className="metric-value">{stats.completedChecks}</div>
            <div className="metric-label">Sudah Dicek</div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <CalendarDays size={18} />
            Daftar Reminder {MONTHS[month - 1]} {year}
          </h2>
          <span
            style={{
              fontSize: "0.8rem",
              color: "var(--muted)",
            }}
          >
            {reminders.length} data
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Customer</th>
                <th>No HP/WA</th>
                <th>Plat Mobil</th>
                <th>Kategori</th>
                <th>Cek Ke-</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "var(--muted)",
                    }}
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : reminders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "3rem",
                      color: "var(--muted)",
                    }}
                  >
                    Tidak ada reminder untuk periode ini
                  </td>
                </tr>
              ) : (
                reminders.map((r, idx) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500, color: "var(--muted)" }}>
                      {idx + 1}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                    <td>{r.customerPhone}</td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
                        {r.customerLicensePlate}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-category">
                        {CATEGORIES[r.batteryCategory] || r.batteryCategory}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>Ke-{r.checkOrder}</span>
                    </td>
                    <td>{formatDate(r.dueDate)}</td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === "ACTIVE"
                            ? "badge-active"
                            : "badge-expired"
                        }`}
                      >
                        {r.status === "ACTIVE" ? "Aktif" : "Expired"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
