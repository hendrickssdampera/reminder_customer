"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Pencil,
  Trash2,
  UserPlus,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  licensePlate: string;
  batteryCategory: string;
  batteryModel: string | null;
  purchaseDate: string;
  warrantyDurationMonths: number;
  checkIntervalMonths: number;
  status: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CATEGORIES: Record<string, string> = {
  MF_ISS_LN: "MF/ISS/LN",
  CALCIUM: "Calcium",
  HYBRID: "Hybrid",
  OTHER: "Lainnya",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(
    null
  );
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    licensePlate: "",
    batteryCategory: "",
    status: "",
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/customers?${params}`);
      const json = await res.json();

      if (res.ok) {
        setCustomers(json.data || []);
        setPagination(json.pagination || pagination);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Edit handlers
  const openEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone,
      licensePlate: customer.licensePlate,
      batteryCategory: customer.batteryCategory,
      status: customer.status,
    });
  };

  const handleEditSubmit = async () => {
    if (!editCustomer) return;
    try {
      const res = await fetch(`/api/customers/${editCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        showToast("success", "Customer berhasil diupdate");
        setEditCustomer(null);
        fetchCustomers();
      } else {
        const json = await res.json();
        showToast("error", json.error || "Gagal mengupdate");
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan");
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteCustomer) return;
    try {
      const res = await fetch(`/api/customers/${deleteCustomer.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("success", "Customer berhasil dihapus");
        setDeleteCustomer(null);
        fetchCustomers();
      } else {
        const json = await res.json();
        showToast("error", json.error || "Gagal menghapus");
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

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
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--foreground)",
            }}
          >
            Data Customer
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.925rem" }}>
            Kelola data pelanggan dan garansi aki
          </p>
        </div>
        <Link href="/customers/new" className="btn btn-primary">
          <UserPlus size={16} />
          Tambah Customer
        </Link>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
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
            placeholder="Cari nama, plat, atau no HP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>No HP</th>
                <th>Plat Mobil</th>
                <th>Kategori</th>
                <th>Tgl Beli</th>
                <th>Garansi</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                    Memuat data...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                    Belum ada data customer
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.phone}</td>
                    <td>
                      <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
                        {c.licensePlate}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-category">
                        {CATEGORIES[c.batteryCategory] || c.batteryCategory}
                      </span>
                    </td>
                    <td>{formatDate(c.purchaseDate)}</td>
                    <td>{c.warrantyDurationMonths} bln</td>
                    <td>
                      <span
                        className={`badge ${c.status === "ACTIVE" ? "badge-active" : "badge-expired"}`}
                      >
                        {c.status === "ACTIVE" ? "Aktif" : "Expired"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "0.375rem", justifyContent: "center" }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "0.375rem 0.5rem", fontSize: "0.8rem" }}
                          onClick={() => openEdit(c)}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "0.375rem 0.5rem", fontSize: "0.8rem" }}
                          onClick={() => setDeleteCustomer(c)}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: "1rem 1.25rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.85rem",
              color: "var(--muted)",
            }}
          >
            <span>
              Menampilkan {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              dari {pagination.total} data
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.375rem 0.625rem" }}
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page - 1 }))
                }
              >
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-secondary"
                style={{ padding: "0.375rem 0.625rem" }}
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((p) => ({ ...p, page: p.page + 1 }))
                }
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editCustomer && (
        <div className="modal-overlay" onClick={() => setEditCustomer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                Edit Customer
              </h3>
              <button
                onClick={() => setEditCustomer(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Nama Customer</label>
                  <input
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">No HP / WA</label>
                  <input
                    className="form-input"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">No Polisi</label>
                  <input
                    className="form-input"
                    value={editForm.licensePlate}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        licensePlate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status Garansi</label>
                  <select
                    className="form-select"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, status: e.target.value }))
                    }
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEditCustomer(null)}
              >
                Batal
              </button>
              <button className="btn btn-primary" onClick={handleEditSubmit}>
                <Save size={16} />
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCustomer && (
        <div className="modal-overlay" onClick={() => setDeleteCustomer(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--danger)" }}>
                Konfirmasi Hapus
              </h3>
              <button
                onClick={() => setDeleteCustomer(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "0.925rem", lineHeight: 1.6 }}>
                Apakah Anda yakin ingin menghapus data customer{" "}
                <strong>{deleteCustomer.name}</strong> ({deleteCustomer.licensePlate})?
              </p>
              <p
                style={{
                  fontSize: "0.825rem",
                  color: "var(--danger)",
                  marginTop: "0.75rem",
                }}
              >
                ⚠️ Semua jadwal cek rutin terkait juga akan dihapus. Tindakan
                ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteCustomer(null)}
              >
                Batal
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={16} />
                Hapus Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
