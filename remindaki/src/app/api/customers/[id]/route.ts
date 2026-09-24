import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/customers/[id]
 * Update customer information
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan" },
        { status: 404 }
      );
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? existing.name,
        phone: body.phone?.trim() ?? existing.phone,
        licensePlate: body.licensePlate?.trim().toUpperCase() ?? existing.licensePlate,
        batteryCategory: body.batteryCategory ?? existing.batteryCategory,
        batteryModel: body.batteryModel !== undefined ? body.batteryModel?.trim() || null : existing.batteryModel,
        status: body.status ?? existing.status,
      },
      include: {
        checkSchedules: {
          orderBy: { checkOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      data: customer,
      message: "Customer berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Gagal mengupdate customer" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete customer and cascade schedule records
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.customer.delete({ where: { id } });

    return NextResponse.json({
      message: "Customer berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Gagal menghapus customer" },
      { status: 500 }
    );
  }
}
