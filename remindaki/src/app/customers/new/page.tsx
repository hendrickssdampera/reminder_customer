"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";

const CATEGORIES = [
  { value: "MF_ISS_LN", label: "MF/ISS/LN" },
  { value: "CALCIUM", label: "Calcium" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "OTHER", label: "Lainnya" },
];

const WARRANTY_DURATIONS = [
  { value: 6, label: "6 Bulan" },
  { value: 12, label: "12 Bulan" },
  { value: 18, label: "18 Bulan" },
  { value: 24, label: "24 Bulan" },
];

const CHECK_INTERVALS = [
  { value: 2, label: "Setiap 2 Bulan" },
  { value: 3, label: "Setiap 3 Bulan" },
];

interface FormErrors {
  [key: string]: string;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    licensePlate: "",
    batteryCategory: "",
    batteryModel: "",
    purchaseDate: "",
    warrantyDurationMonths: "",
    checkIntervalMonths: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        warrantyDurationMonths: Number(formData.warrantyDurationMonths),
        checkIntervalMonths: Number(formData.checkIntervalMonths),
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.details) {
          const fieldErrors: FormErrors = {};
          json.details.forEach((err: { field: string; message: string }) => {
            fieldErrors[err.field] = err.message;
          });
          setErrors(fieldErrors);
        }
        setToast({ type: "error", message: json.error || "Gagal menambahkan customer" });
        return;
      }

      setToast({ type: "success", message: "Customer berhasil ditambahkan!" });

      // Reset form
      setFormData({
        name: "",
        phone: "",
        licensePlate: "",
        batteryCategory: "",
        batteryModel: "",
        purchaseDate: "",
        warrantyDurationMonths: "",
        checkIntervalMonths: "",
      });

      // Redirect after delay
      setTimeout(() => router.push("/customers"), 1500);
    } catch {
      setToast({ type: "error", message: "Terjadi kesalahan jaringan" });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Calculate preview schedules
  const previewSchedules = () => {
    if (!formData.purchaseDate || !formData.warrantyDurationMonths || !formData.checkIntervalMonths) {
      return [];
    }
    const duration = Number(formData.warrantyDurationMonths);
    const interval = Number(formData.checkIntervalMonths);
    const purchase = new Date(formData.purchaseDate);
    const totalChecks = Math.floor(duration / interval);
    const schedules = [];

    for (let i = 1; i <= totalChecks; i++) {
      const dueDate = new Date(purchase);
      dueDate.setMonth(dueDate.getMonth() + i * interval);
      schedules.push({
        order: i,
        date: dueDate.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });
    }
    return schedules;
  };

  const schedules = previewSchedules();

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={() => router.back()}
          style={{ padding: "0.5rem" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--foreground)",
            }}
          >
            Tambah Customer Baru
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.925rem" }}>
            Input data transaksi garansi aki pelanggan
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "1.5rem", alignItems: "start" }}>
        {/* Form */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1.25rem",
              }}
            >
              {/* Nama */}
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">
                  Nama Customer <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  className="form-input"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso"
                />
                {errors.name && (
                  <span className="form-error">{errors.name}</span>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  No HP / WA <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  className="form-input"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08123456789"
                />
                {errors.phone && (
                  <span className="form-error">{errors.phone}</span>
                )}
              </div>

              {/* License Plate */}
              <div className="form-group">
                <label className="form-label">
                  No Polisi / Plat <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  className="form-input"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleChange}
                  placeholder="B 1234 ABC"
                  style={{ textTransform: "uppercase" }}
                />
                {errors.licensePlate && (
                  <span className="form-error">{errors.licensePlate}</span>
                )}
              </div>

              {/* Battery Category */}
              <div className="form-group">
                <label className="form-label">
                  Kategori Aki <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  className="form-select"
                  name="batteryCategory"
                  value={formData.batteryCategory}
                  onChange={handleChange}
                >
                  <option value="">Pilih kategori...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.batteryCategory && (
                  <span className="form-error">{errors.batteryCategory}</span>
                )}
              </div>

              {/* Battery Model */}
              <div className="form-group">
                <label className="form-label">Merek / Tipe Aki</label>
                <input
                  className="form-input"
                  name="batteryModel"
                  value={formData.batteryModel}
                  onChange={handleChange}
                  placeholder="Contoh: GS Astra MF"
                />
              </div>

              {/* Purchase Date */}
              <div className="form-group">
                <label className="form-label">
                  Tanggal Pembelian <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                />
                {errors.purchaseDate && (
                  <span className="form-error">{errors.purchaseDate}</span>
                )}
              </div>

              {/* Warranty Duration */}
              <div className="form-group">
                <label className="form-label">
                  Durasi Garansi <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  className="form-select"
                  name="warrantyDurationMonths"
                  value={formData.warrantyDurationMonths}
                  onChange={handleChange}
                >
                  <option value="">Pilih durasi...</option>
                  {WARRANTY_DURATIONS.map((w) => (
                    <option key={w.value} value={w.value}>
                      {w.label}
                    </option>
                  ))}
                </select>
                {errors.warrantyDurationMonths && (
                  <span className="form-error">{errors.warrantyDurationMonths}</span>
                )}
              </div>

              {/* Check Interval */}
              <div className="form-group">
                <label className="form-label">
                  Interval Cek Rutin <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select
                  className="form-select"
                  name="checkIntervalMonths"
                  value={formData.checkIntervalMonths}
                  onChange={handleChange}
                >
                  <option value="">Pilih interval...</option>
                  {CHECK_INTERVALS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.checkIntervalMonths && (
                  <span className="form-error">{errors.checkIntervalMonths}</span>
                )}
              </div>
            </div>

            {/* Submit */}
            <div
              style={{
                marginTop: "1.5rem",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => router.back()}
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <Save size={16} />
                {submitting ? "Menyimpan..." : "Simpan Customer"}
              </button>
            </div>
          </form>
        </div>

        {/* Schedule Preview */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            📅 Preview Jadwal Cek
          </h3>

          {schedules.length === 0 ? (
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--muted)",
                textAlign: "center",
                padding: "1.5rem 0",
              }}
            >
              Isi tanggal pembelian, durasi garansi, dan interval cek untuk
              melihat preview jadwal
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {schedules.map((s) => (
                <div
                  key={s.order}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.625rem 0.875rem",
                    background: "var(--background)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                    Cek Ke-{s.order}
                  </span>
                  <span style={{ color: "var(--muted)" }}>{s.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
