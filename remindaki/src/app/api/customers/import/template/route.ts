import { NextResponse } from "next/server";
import { generateImportTemplate } from "@/lib/excel-export";

/**
 * GET /api/customers/import/template
 * Download template Excel kosong untuk import data customer
 */
export async function GET() {
  try {
    const buffer = generateImportTemplate();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Template_Import_Customer_RemindAki.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Gagal membuat template" },
      { status: 500 }
    );
  }
}
