import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReminderSpreadsheet } from "@/lib/excel-export";
import { isWarrantyActive } from "@/lib/schedule";

/**
 * GET /api/reminders/export
 * Generate and stream .xlsx spreadsheet download
 * Query: ?month=9&year=2026
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));

    // Build date range
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch schedules for the month
    const schedules = await prisma.checkSchedule.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        customer: true,
      },
      orderBy: { dueDate: "asc" },
    });

    // Map to export format
    const exportData = schedules.map((schedule) => ({
      customerName: schedule.customer.name,
      customerPhone: schedule.customer.phone,
      customerLicensePlate: schedule.customer.licensePlate,
      batteryCategory: schedule.customer.batteryCategory,
      checkOrder: schedule.checkOrder,
      dueDate: schedule.dueDate,
      status: isWarrantyActive(
        schedule.customer.purchaseDate,
        schedule.customer.warrantyDurationMonths
      )
        ? "Aktif"
        : "Expired",
    }));

    // Generate spreadsheet
    const buffer = generateReminderSpreadsheet(exportData, month, year);

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const fileName = `Reminder_${monthNames[month - 1]}_${year}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting reminders:", error);
    return NextResponse.json(
      { error: "Gagal mengekspor data reminder" },
      { status: 500 }
    );
  }
}
