import { addMonths } from "date-fns";

export interface ScheduleEntry {
  checkOrder: number;
  dueDate: Date;
}

/**
 * Menghitung jadwal cek rutin berdasarkan tanggal pembelian, durasi garansi, dan interval cek.
 *
 * Rumus: Jumlah Cek = Durasi Garansi / Interval Cek
 * Contoh: Garansi 12 bulan, Interval 3 bulan → Cek ke-1 (bulan 3), ke-2 (bulan 6), ke-3 (bulan 9), ke-4 (bulan 12)
 */
export function generateCheckSchedules(
  purchaseDate: Date,
  warrantyDurationMonths: number,
  checkIntervalMonths: number
): ScheduleEntry[] {
  const totalChecks = Math.floor(warrantyDurationMonths / checkIntervalMonths);
  const schedules: ScheduleEntry[] = [];

  for (let i = 1; i <= totalChecks; i++) {
    const monthsToAdd = i * checkIntervalMonths;
    schedules.push({
      checkOrder: i,
      dueDate: addMonths(purchaseDate, monthsToAdd),
    });
  }

  return schedules;
}

/**
 * Cek apakah garansi masih aktif berdasarkan tanggal pembelian dan durasi garansi.
 */
export function isWarrantyActive(
  purchaseDate: Date,
  warrantyDurationMonths: number
): boolean {
  const expiryDate = addMonths(purchaseDate, warrantyDurationMonths);
  return new Date() < expiryDate;
}
