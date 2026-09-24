import { PrismaClient } from "@prisma/client";
import { addMonths } from "date-fns";

const prisma = new PrismaClient();

interface SeedCustomer {
  name: string;
  phone: string;
  licensePlate: string;
  batteryCategory: string;
  batteryModel: string | null;
  purchaseDate: Date;
  warrantyDurationMonths: number;
  checkIntervalMonths: number;
}

const sampleCustomers: SeedCustomer[] = [
  {
    name: "Budi Santoso",
    phone: "081234567890",
    licensePlate: "B 1234 ABC",
    batteryCategory: "MF_ISS_LN",
    batteryModel: "GS Astra MF",
    purchaseDate: new Date("2026-01-15"),
    warrantyDurationMonths: 12,
    checkIntervalMonths: 3,
  },
  {
    name: "Siti Rahayu",
    phone: "081298765432",
    licensePlate: "B 5678 DEF",
    batteryCategory: "CALCIUM",
    batteryModel: "Amaron Pro",
    purchaseDate: new Date("2026-02-20"),
    warrantyDurationMonths: 18,
    checkIntervalMonths: 3,
  },
  {
    name: "Ahmad Hidayat",
    phone: "085612345678",
    licensePlate: "D 9012 GHI",
    batteryCategory: "MF_ISS_LN",
    batteryModel: "Yuasa MF",
    purchaseDate: new Date("2026-03-10"),
    warrantyDurationMonths: 12,
    checkIntervalMonths: 2,
  },
  {
    name: "Dewi Lestari",
    phone: "087812345678",
    licensePlate: "B 3456 JKL",
    batteryCategory: "HYBRID",
    batteryModel: "Bosch S4",
    purchaseDate: new Date("2026-04-05"),
    warrantyDurationMonths: 24,
    checkIntervalMonths: 3,
  },
  {
    name: "Rudi Hermawan",
    phone: "081345678901",
    licensePlate: "F 7890 MNO",
    batteryCategory: "CALCIUM",
    batteryModel: "Incoe Gold",
    purchaseDate: new Date("2026-05-12"),
    warrantyDurationMonths: 12,
    checkIntervalMonths: 3,
  },
  {
    name: "Rina Wijaya",
    phone: "082156789012",
    licensePlate: "B 2345 PQR",
    batteryCategory: "MF_ISS_LN",
    batteryModel: "GS Premium",
    purchaseDate: new Date("2025-12-01"),
    warrantyDurationMonths: 6,
    checkIntervalMonths: 2,
  },
  {
    name: "Joko Prasetyo",
    phone: "089876543210",
    licensePlate: "AB 1122 STU",
    batteryCategory: "OTHER",
    batteryModel: "Panasonic",
    purchaseDate: new Date("2026-06-18"),
    warrantyDurationMonths: 12,
    checkIntervalMonths: 3,
  },
  {
    name: "Sri Mulyani",
    phone: "081567890123",
    licensePlate: "B 6789 VWX",
    batteryCategory: "CALCIUM",
    batteryModel: "Amaron Go",
    purchaseDate: new Date("2026-07-01"),
    warrantyDurationMonths: 18,
    checkIntervalMonths: 3,
  },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  await prisma.checkSchedule.deleteMany();
  await prisma.customer.deleteMany();
  console.log("🗑️  Data lama dihapus.\n");

  for (const customer of sampleCustomers) {
    const totalChecks = Math.floor(
      customer.warrantyDurationMonths / customer.checkIntervalMonths
    );

    const schedules = [];
    for (let i = 1; i <= totalChecks; i++) {
      schedules.push({
        checkOrder: i,
        dueDate: addMonths(customer.purchaseDate, i * customer.checkIntervalMonths),
      });
    }

    const created = await prisma.customer.create({
      data: {
        name: customer.name,
        phone: customer.phone,
        licensePlate: customer.licensePlate,
        batteryCategory: customer.batteryCategory,
        batteryModel: customer.batteryModel,
        purchaseDate: customer.purchaseDate,
        warrantyDurationMonths: customer.warrantyDurationMonths,
        checkIntervalMonths: customer.checkIntervalMonths,
        checkSchedules: {
          create: schedules,
        },
      },
    });

    console.log(
      `✅ ${created.name} (${created.licensePlate}) — ${totalChecks} jadwal cek`
    );
  }

  const totalCustomers = await prisma.customer.count();
  const totalSchedules = await prisma.checkSchedule.count();

  console.log(`\n🎉 Seeding selesai!`);
  console.log(`   📊 ${totalCustomers} customers, ${totalSchedules} jadwal cek rutin`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
