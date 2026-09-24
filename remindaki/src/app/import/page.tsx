"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

interface ImportSummary {
  totalRows: number;
  successCount: number;
  validationErrors: { row: number; errors: string[] }[];
  insertErrors: { row: number; error: string }[];
}

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    summary: ImportSummary;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    } else {
      setError("File harus berformat .xlsx atau .xls");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/customers/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        setResult({ message: json.message, summary: json.summary });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setError(json.error || "Gagal mengimport data");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/customers/import/template");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Template_Import_Customer_RemindAki.xlsx";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      setError("Gagal mengunduh template");
    }
  };

  const totalErrors = result
    ? result.summary.validationErrors.length + result.summary.insertErrors.length
    : 0;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "var(--foreground)",
          }}
        >
          Import Data Excel
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.925rem" }}>
          Upload file Excel (.xlsx) untuk menambahkan data customer secara massal
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        {/* Upload Area */}
        <div className="card" style={{ padding: "1.5rem" }}>
          {/* Download Template */}
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "1rem",
              background: "var(--primary-light)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1e40af" }}>
                📄 Belum punya format file?
              </p>
              <p style={{ fontSize: "0.8rem", color: "#3b82f6" }}>
                Download template Excel untuk memastikan format data benar
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleDownloadTemplate}>
              <Download size={16} />
              Download Template
            </button>
          </div>

          {/* Drop Zone */}
          <div
            className={`upload-zone ${dragOver ? "drag-over" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <div className="upload-icon">
              <Upload size={40} />
            </div>
            <p className="upload-text">
              Drag & drop file Excel di sini, atau{" "}
              <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                klik untuk pilih file
              </span>
            </p>
            <p className="upload-hint">Format yang didukung: .xlsx, .xls</p>
          </div>

          {/* Selected File */}
          {file && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.875rem 1rem",
                background: "var(--background)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FileSpreadsheet size={20} color="var(--secondary)" />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "0.375rem 0.5rem" }}
                >
                  <X size={16} />
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mengimport...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Import Data
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.875rem 1rem",
                background: "var(--danger-light)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#991b1b",
                fontSize: "0.875rem",
              }}
            >
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ marginTop: "1.5rem" }}>
              {/* Success Summary */}
              <div
                style={{
                  padding: "1rem",
                  background: "var(--secondary-light)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <CheckCircle2 size={18} color="#065f46" />
                  <span style={{ fontWeight: 600, color: "#065f46", fontSize: "0.925rem" }}>
                    {result.message}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.85rem", color: "#065f46" }}>
                  <span>Total baris: {result.summary.totalRows}</span>
                  <span>✅ Berhasil: {result.summary.successCount}</span>
                  <span>❌ Gagal: {totalErrors}</span>
                </div>
              </div>

              {/* Error Details */}
              {totalErrors > 0 && (
                <div className="card" style={{ padding: "1rem" }}>
                  <h4
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      marginBottom: "0.75rem",
                      color: "var(--danger)",
                    }}
                  >
                    Detail Error
                  </h4>
                  <div
                    style={{
                      maxHeight: "250px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {result.summary.validationErrors.map((err, idx) => (
                      <div
                        key={`v-${idx}`}
                        style={{
                          padding: "0.5rem 0.75rem",
                          background: "var(--danger-light)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.8rem",
                        }}
                      >
                        <strong>Baris {err.row}:</strong>{" "}
                        {err.errors.join(", ")}
                      </div>
                    ))}
                    {result.summary.insertErrors.map((err, idx) => (
                      <div
                        key={`i-${idx}`}
                        style={{
                          padding: "0.5rem 0.75rem",
                          background: "var(--accent-light)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.8rem",
                        }}
                      >
                        <strong>Baris {err.row}:</strong> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            📋 Panduan Import
          </h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.875rem",
              fontSize: "0.825rem",
              color: "var(--muted)",
              lineHeight: 1.6,
            }}
          >
            <div>
              <strong style={{ color: "var(--foreground)" }}>1. Download Template</strong>
              <p>Download template Excel dan isi data sesuai format kolom yang sudah disediakan.</p>
            </div>
            <div>
              <strong style={{ color: "var(--foreground)" }}>2. Format Kolom</strong>
              <ul style={{ paddingLeft: "1rem", marginTop: "0.25rem" }}>
                <li>Nama Customer (wajib)</li>
                <li>No HP/WA (wajib, format: 08xxx)</li>
                <li>No Polisi (wajib)</li>
                <li>Kategori Aki (MF_ISS_LN / CALCIUM / HYBRID / OTHER)</li>
                <li>Merek Aki (opsional)</li>
                <li>Tanggal Beli (format: YYYY-MM-DD)</li>
                <li>Durasi Garansi (6 / 12 / 18 / 24)</li>
                <li>Interval Cek (2 / 3)</li>
              </ul>
            </div>
            <div>
              <strong style={{ color: "var(--foreground)" }}>3. Upload & Import</strong>
              <p>
                Upload file yang sudah diisi. Sistem akan otomatis memvalidasi
                setiap baris dan membuat jadwal cek rutin.
              </p>
            </div>
            <div
              style={{
                padding: "0.75rem",
                background: "var(--accent-light)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8rem",
                color: "#92400e",
              }}
            >
              💡 <strong>Tip:</strong> Baris yang error akan dilaporkan
              detailnya, tapi baris valid tetap diproses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
