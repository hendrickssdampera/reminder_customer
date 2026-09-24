import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExcelImport } from "@/lib/excel-import";
import { generateCheckSchedules } from "@/lib/schedule";

/**
 * POST /api/customers/import
 * Upload & parse file Excel → batch insert customers with auto-generated schedules
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File Excel wajib diupload" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { error: "File harus berformat .xlsx atau .xls" },
        { status: 400 }
      );
    }

    // Parse Excel file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const importResult = parseExcelImport(buffer);

    if (importResult.totalRows === 0) {
      return NextResponse.json(
        { error: "File Excel kosong, tidak ada data untuk diimport" },
        { status: 400 }
      );
    }

    // Batch insert valid rows
    let successCount = 0;
    const insertErrors: { row: number; error: string }[] = [];

    for (const row of importResult.validRows) {
      try {
        const schedules = generateCheckSchedules(
          row.purchaseDate,
          row.warrantyDurationMonths,
          row.checkIntervalMonths
        );

        await prisma.customer.create({
          data: {
            name: row.name,
            phone: row.phone,
            licensePlate: row.licensePlate,
            batteryCategory: row.batteryCategory,
            batteryModel: row.batteryModel,
            purchaseDate: row.purchaseDate,
            warrantyDurationMonths: row.warrantyDurationMonths,
            checkIntervalMonths: row.checkIntervalMonths,
            checkSchedules: {
              create: schedules.map((s) => ({
                checkOrder: s.checkOrder,
                dueDate: s.dueDate,
              })),
            },
          },
        });
        successCount++;
      } catch (err) {
        insertErrors.push({
          row: importResult.validRows.indexOf(row) + 2,
          error: err instanceof Error ? err.message : "Database error",
        });
      }
    }

    return NextResponse.json({
      message: `Import selesai: ${successCount} berhasil, ${importResult.errorRows.length + insertErrors.length} gagal`,
      summary: {
        totalRows: importResult.totalRows,
        successCount,
        validationErrors: importResult.errorRows,
        insertErrors,
      },
    });
  } catch (error) {
    console.error("Error importing customers:", error);
    return NextResponse.json(
      { error: "Gagal mengimport data customer" },
      { status: 500 }
    );
  }
}
