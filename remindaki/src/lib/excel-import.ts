import * as XLSX from "xlsx";
import { validateCustomerInput } from "./validations";

export interface ImportedCustomerRow {
  name: string;
  phone: string;
  licensePlate: string;
  batteryCategory: string;
  batteryModel: string | null;
  purchaseDate: Date;
  warrantyDurationMonths: number;
  checkIntervalMonths: number;
}

export interface ImportRowError {
  row: number;
  errors: string[];
}

export interface ImportResult {
  validRows: ImportedCustomerRow[];
  errorRows: ImportRowError[];
  totalRows: number;
}

/**
 * Mapping kolom Excel yang dikenali (case-insensitive, flexible naming)
 */
const COLUMN_MAPPINGS: Record<string, string> = {
  // Nama
  "nama": "name",
  "nama customer": "name",
  "name": "name",
  "customer": "name",
  // Phone
  "no hp": "phone",
  "no hp/wa": "phone",
  "no handphone": "phone",
  "no_hp": "phone",
  "phone": "phone",
  "hp": "phone",
  "wa": "phone",
  "whatsapp": "phone",
  // License Plate
  "no polisi": "licensePlate",
  "no_polisi": "licensePlate",
  "plat": "licensePlate",
  "plat nomor": "licensePlate",
  "no plat": "licensePlate",
  "license plate": "licensePlate",
  // Battery Category
  "kategori aki": "batteryCategory",
  "kategori_aki": "batteryCategory",
  "kategori": "batteryCategory",
  "category": "batteryCategory",
  "battery category": "batteryCategory",
  // Battery Model
  "merek aki": "batteryModel",
  "merek_aki": "batteryModel",
  "merek/tipe aki": "batteryModel",
  "merek/tipe aki (opsional)": "batteryModel",
  "tipe aki": "batteryModel",
  "merek": "batteryModel",
  "brand": "batteryModel",
  "model": "batteryModel",
  // Purchase Date
  "tanggal beli": "purchaseDate",
  "tanggal_beli": "purchaseDate",
  "tgl beli": "purchaseDate",
  "tanggal pembelian": "purchaseDate",
  "purchase date": "purchaseDate",
  "tanggal beli (yyyy-mm-dd)": "purchaseDate",
  // Warranty Duration
  "durasi garansi": "warrantyDurationMonths",
  "durasi_garansi": "warrantyDurationMonths",
  "garansi": "warrantyDurationMonths",
  "garansi (bulan)": "warrantyDurationMonths",
  "durasi garansi (6/12/18/24 bulan)": "warrantyDurationMonths",
  "warranty": "warrantyDurationMonths",
  // Check Interval
  "interval cek": "checkIntervalMonths",
  "interval_cek": "checkIntervalMonths",
  "interval": "checkIntervalMonths",
  "interval cek (2/3 bulan)": "checkIntervalMonths",
  "check interval": "checkIntervalMonths",
};

/**
 * Mapping value kategori aki yang sering digunakan di Excel
 */
const CATEGORY_MAPPINGS: Record<string, string> = {
  "mf/iss/ln": "MF_ISS_LN",
  "mf_iss_ln": "MF_ISS_LN",
  "mf": "MF_ISS_LN",
  "iss": "MF_ISS_LN",
  "ln": "MF_ISS_LN",
  "calcium": "CALCIUM",
  "cal": "CALCIUM",
  "hybrid": "HYBRID",
  "other": "OTHER",
  "lainnya": "OTHER",
};

/**
 * Parse file Excel (.xlsx) dan return data customer yang valid + error per baris
 */
export function parseExcelImport(fileBuffer: Buffer): ImportResult {
  const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });

  // Ambil sheet pertama
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { validRows: [], errorRows: [], totalRows: 0 };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  if (rawData.length === 0) {
    return { validRows: [], errorRows: [], totalRows: 0 };
  }

  // Map kolom Excel ke field internal
  const headerKeys = Object.keys(rawData[0]);
  const columnMap = mapHeaders(headerKeys);

  const validRows: ImportedCustomerRow[] = [];
  const errorRows: ImportRowError[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const rowNum = i + 2; // +2 karena baris 1 = header, data mulai baris 2

    try {
      const mapped = mapRowToCustomer(row, columnMap);

      // Validasi menggunakan validator yang sama
      const validation = validateCustomerInput({
        name: mapped.name,
        phone: mapped.phone,
        licensePlate: mapped.licensePlate,
        batteryCategory: mapped.batteryCategory,
        purchaseDate: mapped.purchaseDate,
        warrantyDurationMonths: mapped.warrantyDurationMonths,
        checkIntervalMonths: mapped.checkIntervalMonths,
      });

      if (!validation.valid) {
        errorRows.push({
          row: rowNum,
          errors: validation.errors.map((e) => `${e.field}: ${e.message}`),
        });
      } else {
        validRows.push(mapped);
      }
    } catch (err) {
      errorRows.push({
        row: rowNum,
        errors: [`Error parsing baris: ${err instanceof Error ? err.message : "Unknown error"}`],
      });
    }
  }

  return {
    validRows,
    errorRows,
    totalRows: rawData.length,
  };
}

/**
 * Map header Excel ke field internal menggunakan flexible matching
 */
function mapHeaders(headers: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();
    const mappedField = COLUMN_MAPPINGS[normalizedHeader];
    if (mappedField) {
      result[header] = mappedField;
    }
  }

  return result;
}

/**
 * Map satu baris Excel ke ImportedCustomerRow
 */
function mapRowToCustomer(
  row: Record<string, unknown>,
  columnMap: Record<string, string>
): ImportedCustomerRow {
  const mapped: Record<string, unknown> = {};

  for (const [excelCol, internalField] of Object.entries(columnMap)) {
    mapped[internalField] = row[excelCol];
  }

  // Normalize category
  const rawCategory = String(mapped.batteryCategory || "").toLowerCase().trim();
  const normalizedCategory = CATEGORY_MAPPINGS[rawCategory] || rawCategory.toUpperCase();

  // Parse purchase date
  let purchaseDate: Date;
  if (mapped.purchaseDate instanceof Date) {
    purchaseDate = mapped.purchaseDate;
  } else {
    purchaseDate = new Date(String(mapped.purchaseDate));
  }

  // Parse numeric fields
  const warrantyDurationMonths = Number(mapped.warrantyDurationMonths);
  const checkIntervalMonths = Number(mapped.checkIntervalMonths);

  return {
    name: String(mapped.name || "").trim(),
    phone: String(mapped.phone || "").trim(),
    licensePlate: String(mapped.licensePlate || "").trim().toUpperCase(),
    batteryCategory: normalizedCategory,
    batteryModel: mapped.batteryModel ? String(mapped.batteryModel).trim() : null,
    purchaseDate,
    warrantyDurationMonths,
    checkIntervalMonths,
  };
}
