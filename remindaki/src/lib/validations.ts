/**
 * Validasi input data customer untuk form dan import Excel
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const VALID_CATEGORIES = ["MF_ISS_LN", "CALCIUM", "HYBRID", "OTHER"] as const;
const VALID_WARRANTY_DURATIONS = [6, 12, 18, 24] as const;
const VALID_CHECK_INTERVALS = [2, 3] as const;

export type BatteryCategory = (typeof VALID_CATEGORIES)[number];
export type WarrantyDuration = (typeof VALID_WARRANTY_DURATIONS)[number];
export type CheckInterval = (typeof VALID_CHECK_INTERVALS)[number];

/**
 * Validasi format nomor HP Indonesia (08xxxxxxxxxx)
 */
export function isValidPhone(phone: string): boolean {
  return /^08\d{8,12}$/.test(phone.replace(/[\s-]/g, ""));
}

/**
 * Validasi format plat nomor kendaraan (contoh: B 1234 ABC)
 */
export function isValidLicensePlate(plate: string): boolean {
  return /^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/i.test(plate.trim());
}

/**
 * Validasi kategori aki
 */
export function isValidCategory(category: string): category is BatteryCategory {
  return VALID_CATEGORIES.includes(category as BatteryCategory);
}

/**
 * Validasi durasi garansi
 */
export function isValidWarrantyDuration(
  duration: number
): duration is WarrantyDuration {
  return VALID_WARRANTY_DURATIONS.includes(duration as WarrantyDuration);
}

/**
 * Validasi interval cek
 */
export function isValidCheckInterval(
  interval: number
): interval is CheckInterval {
  return VALID_CHECK_INTERVALS.includes(interval as CheckInterval);
}

/**
 * Validasi lengkap data customer
 */
export function validateCustomerInput(data: {
  name?: string;
  phone?: string;
  licensePlate?: string;
  batteryCategory?: string;
  purchaseDate?: string | Date;
  warrantyDurationMonths?: number;
  checkIntervalMonths?: number;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Name
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Nama customer wajib diisi" });
  }

  // Phone
  if (!data.phone || data.phone.trim().length === 0) {
    errors.push({ field: "phone", message: "No HP/WA wajib diisi" });
  } else if (!isValidPhone(data.phone)) {
    errors.push({
      field: "phone",
      message: "Format No HP tidak valid (contoh: 08123456789)",
    });
  }

  // License Plate
  if (!data.licensePlate || data.licensePlate.trim().length === 0) {
    errors.push({
      field: "licensePlate",
      message: "No Polisi/Plat wajib diisi",
    });
  } else if (!isValidLicensePlate(data.licensePlate)) {
    errors.push({
      field: "licensePlate",
      message: "Format No Polisi tidak valid (contoh: B 1234 ABC)",
    });
  }

  // Battery Category
  if (!data.batteryCategory) {
    errors.push({
      field: "batteryCategory",
      message: "Kategori aki wajib dipilih",
    });
  } else if (!isValidCategory(data.batteryCategory)) {
    errors.push({
      field: "batteryCategory",
      message: `Kategori aki tidak valid. Pilihan: ${VALID_CATEGORIES.join(", ")}`,
    });
  }

  // Purchase Date
  if (!data.purchaseDate) {
    errors.push({
      field: "purchaseDate",
      message: "Tanggal pembelian wajib diisi",
    });
  } else {
    const date = new Date(data.purchaseDate);
    if (isNaN(date.getTime())) {
      errors.push({
        field: "purchaseDate",
        message: "Tanggal pembelian tidak valid",
      });
    }
  }

  // Warranty Duration
  if (data.warrantyDurationMonths === undefined || data.warrantyDurationMonths === null) {
    errors.push({
      field: "warrantyDurationMonths",
      message: "Durasi garansi wajib dipilih",
    });
  } else if (!isValidWarrantyDuration(data.warrantyDurationMonths)) {
    errors.push({
      field: "warrantyDurationMonths",
      message: `Durasi garansi tidak valid. Pilihan: ${VALID_WARRANTY_DURATIONS.join(", ")} bulan`,
    });
  }

  // Check Interval
  if (data.checkIntervalMonths === undefined || data.checkIntervalMonths === null) {
    errors.push({
      field: "checkIntervalMonths",
      message: "Interval cek wajib dipilih",
    });
  } else if (!isValidCheckInterval(data.checkIntervalMonths)) {
    errors.push({
      field: "checkIntervalMonths",
      message: `Interval cek tidak valid. Pilihan: ${VALID_CHECK_INTERVALS.join(", ")} bulan`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
