import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCheckSchedules } from "@/lib/schedule";
import { validateCustomerInput } from "@/lib/validations";

/**
 * GET /api/customers
 * Fetch customers with optional search & pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { licensePlate: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          checkSchedules: {
            orderBy: { checkOrder: "asc" as const },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data customer" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * Create customer & auto-generate check schedules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateCustomerInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validasi gagal", details: validation.errors },
        { status: 400 }
      );
    }

    // Generate check schedules
    const schedules = generateCheckSchedules(
      new Date(body.purchaseDate),
      body.warrantyDurationMonths,
      body.checkIntervalMonths
    );

    // Create customer with schedules in a transaction
    const customer = await prisma.customer.create({
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        licensePlate: body.licensePlate.trim().toUpperCase(),
        batteryCategory: body.batteryCategory,
        batteryModel: body.batteryModel?.trim() || null,
        purchaseDate: new Date(body.purchaseDate),
        warrantyDurationMonths: body.warrantyDurationMonths,
        checkIntervalMonths: body.checkIntervalMonths,
        checkSchedules: {
          create: schedules.map((s) => ({
            checkOrder: s.checkOrder,
            dueDate: s.dueDate,
          })),
        },
      },
      include: {
        checkSchedules: {
          orderBy: { checkOrder: "asc" },
        },
      },
    });

    return NextResponse.json(
      { data: customer, message: "Customer berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan customer" },
      { status: 500 }
    );
  }
}
