import * as XLSX from "xlsx";

interface ReminderExportRow {
  no: number;
  name: string;
  phone: string;
  licensePlate: string;
  batteryCategory: string;
  checkOrder: string;
  dueDate: string;
  status: string;
}

/**
 * Generate Excel (.xlsx) buffer dari data reminder
 */
export function generateReminderSpreadsheet(
  data: {
    customerName: string;
    customerPhone: string;
    customerLicensePlate: string;
    batteryCategory: string;
    checkOrder: number;
    dueDate: Date;
    status: string;
  }[],
  month: number,
  year: number
): Buffer {
  const rows: ReminderExportRow[] = data.map((item, index) => ({
    no: index + 1,
    name: item.customerName,
    phone: item.customerPhone,
    licensePlate: item.customerLicensePlate,
    batteryCategory: formatCategory(item.batteryCategory),
    checkOrder: `Cek Ke-${item.checkOrder}`,
    dueDate: formatDate(item.dueDate),
    status: item.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "no",
      "name",
      "phone",
      "licensePlate",
      "batteryCategory",
      "checkOrder",
      "dueDate",
      "status",
    ],
  });

  // Header labels
  worksheet["A1"] = { v: "No", t: "s" };
  worksheet["B1"] = { v: "Nama Customer", t: "s" };
  worksheet["C1"] = { v: "No Handphone", t: "s" };
  worksheet["D1"] = { v: "No Polisi Mobil", t: "s" };
  worksheet["E1"] = { v: "Kategori Aki", t: "s" };
  worksheet["F1"] = { v: "Jadwal Cek Ke-", t: "s" };
  worksheet["G1"] = { v: "Tanggal Jatuh Tempo", t: "s" };
  worksheet["H1"] = { v: "Status Garansi", t: "s" };

  // Auto-width kolom
  const colWidths = [
    { wch: 5 },   // No
    { wch: 25 },  // Nama
    { wch: 16 },  // HP
    { wch: 14 },  // Plat
    { wch: 14 },  // Kategori
    { wch: 12 },  // Cek Ke-
    { wch: 18 },  // Tanggal
    { wch: 12 },  // Status
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  const monthName = getMonthName(month);
  XLSX.utils.book_append_sheet(workbook, worksheet, `Reminder ${monthName} ${year}`);

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return buffer;
}

/**
 * Generate template Excel kosong untuk import data customer
 */
export function generateImportTemplate(): Buffer {
  const templateData = [
    {
      nama: "Contoh: Budi Santoso",
      no_hp: "081234567890",
      no_polisi: "B 1234 ABC",
      kategori_aki: "MF_ISS_LN",
      merek_aki: "GS Astra",
      tanggal_beli: "2026-01-15",
      durasi_garansi: 12,
      interval_cek: 3,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData, {
    header: [
      "nama",
      "no_hp",
      "no_polisi",
      "kategori_aki",
      "merek_aki",
      "tanggal_beli",
      "durasi_garansi",
      "interval_cek",
    ],
  });

  // Header labels
  worksheet["A1"] = { v: "Nama Customer", t: "s" };
  worksheet["B1"] = { v: "No HP/WA", t: "s" };
  worksheet["C1"] = { v: "No Polisi", t: "s" };
  worksheet["D1"] = { v: "Kategori Aki (MF_ISS_LN / CALCIUM / HYBRID / OTHER)", t: "s" };
  worksheet["E1"] = { v: "Merek/Tipe Aki (Opsional)", t: "s" };
  worksheet["F1"] = { v: "Tanggal Beli (YYYY-MM-DD)", t: "s" };
  worksheet["G1"] = { v: "Durasi Garansi (6/12/18/24 bulan)", t: "s" };
  worksheet["H1"] = { v: "Interval Cek (2/3 bulan)", t: "s" };

  const colWidths = [
    { wch: 25 },
    { wch: 16 },
    { wch: 14 },
    { wch: 48 },
    { wch: 26 },
    { wch: 26 },
    { wch: 32 },
    { wch: 24 },
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Import");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

// --- Helper functions ---

function formatCategory(category: string): string {
  const map: Record<string, string> = {
    MF_ISS_LN: "MF/ISS/LN",
    CALCIUM: "Calcium",
    HYBRID: "Hybrid",
    OTHER: "Lainnya",
  };
  return map[category] || category;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getMonthName(month: number): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return months[month - 1] || "";
}
