import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isWarrantyActive } from "@/lib/schedule";

/**
 * GET /api/reminders
 * Fetch reminders filtered by month and year
 * Query: ?month=9&year=2026&category=MF_ISS_LN&search=keyword
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()));
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";

    // Build date range for the target month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Build where clause for customer filtering
    const customerWhere: Record<string, unknown> = {};
    if (category) {
      customerWhere.batteryCategory = category;
    }
    if (search) {
      customerWhere.OR = [
        { name: { contains: search } },
        { licensePlate: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    // Fetch check schedules with customer data
    const schedules = await prisma.checkSchedule.findMany({
      where: {
        dueDate: {
          gte: startDate,
          lte: endDate,
        },
        customer: Object.keys(customerWhere).length > 0 ? customerWhere : undefined,
      },
      include: {
        customer: true,
      },
      orderBy: { dueDate: "asc" },
    });

    // Map to response format with warranty status
    const reminders = schedules.map((schedule) => ({
      id: schedule.id,
      customerId: schedule.customer.id,
      customerName: schedule.customer.name,
      customerPhone: schedule.customer.phone,
      customerLicensePlate: schedule.customer.licensePlate,
      batteryCategory: schedule.customer.batteryCategory,
      batteryModel: schedule.customer.batteryModel,
      checkOrder: schedule.checkOrder,
      dueDate: schedule.dueDate,
      isCompleted: schedule.isCompleted,
      status: isWarrantyActive(
        schedule.customer.purchaseDate,
        schedule.customer.warrantyDurationMonths
      )
        ? "ACTIVE"
        : "EXPIRED",
    }));

    // Aggregate stats
    const stats = {
      totalReminders: reminders.length,
      activeWarranties: reminders.filter((r) => r.status === "ACTIVE").length,
      expiredWarranties: reminders.filter((r) => r.status === "EXPIRED").length,
      completedChecks: reminders.filter((r) => r.isCompleted).length,
    };

    return NextResponse.json({
      data: reminders,
      stats,
      filter: { month, year, category, search },
    });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data reminder" },
      { status: 500 }
    );
  }
}
