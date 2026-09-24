Product Requirement Document (PRD) & Antigravity IDE Build BlueprintNama Proyek: RemindAki - Sistem Manajemen Garansi & Reminder Cek Rutin Toko Aki1. Latar Belakang & Ringkasan EksekutifToko aki menyediakan garansi (6, 12, 18, dan 24 bulan) dengan syarat cek rutin berkala (setiap 2 atau 3 bulan). Pengelolaan data di Excel saat ini mengalami kendala:Data tersebar di banyak sheet berdasarkan bulan (contoh: REM Mei 2026, REM JUNI 2026).Kategori aki (MF/ISS/LN, CALCIUM) dipisah secara manual.Tanggal jatuh tempo dimasukkan sebagai header warna hijau secara manual di dalam sel.Proses penyortiran data untuk pengiriman pesan reminder bulanan membutuhkan waktu lama dan rawan human error.Tujuan Aplikasi:
Membangun web app berbasis database terpusat yang secara otomatis menghitung jadwal cek rutin pelanggan, menampilkan daftar reminder bulanan, serta menyediakan tombol unduh spreadsheet (.xlsx) siap pakai.2. Arsitektur & Tech Stack (Direkomendasikan untuk Antigravity IDE)Aplikasi dirancang menggunakan stack modern full-stack JavaScript/TypeScript yang mudah di-scaffold dan diverifikasi oleh Agent Antigravity IDE:Framework: Next.js (App Router, TypeScript)Styling & UI: Tailwind CSS, Shadcn UI / Radix UI, Lucide IconsDatabase & ORM: SQLite / PostgreSQL dengan Prisma ORMDate Utilities: date-fns (untuk perhitungan presisi jadwal 2/3 bulanan)Spreadsheet Engine: xlsx (SheetJS) / exceljsDevelopment Tool: Antigravity IDE (Agent-first workflow)3. Spesifikasi Kebutuhan Fungsional (Functional Requirements)FR-1: Form Input Data Garansi Baru (Create)Input transaksi pelanggan baru dengan atribut:Nama Customer (String, Required)No Handphone / WA (String, Required, Format: 08xxxxxxxxxx)No Polisi Mobil / Plat (String, Required, Format: B 1234 ABC)Kategori Aki (Enum: MF/ISS/LN, CALCIUM, HYBRID, OTHER)Merek / Tipe Aki (String, Optional)Tanggal Pembelian (Date Picker, Required)Durasi Garansi (Select: 6, 12, 18, 24 Bulan)Interval Cek Rutin (Select: 2 Bulan, 3 Bulan)FR-2: Algoritma Kalkulasi Otomatis Jadwal Cek RutinSistem harus membuat array tanggal jatuh tempo cek rutin secara otomatis saat transaksi disimpan:Rumus: $\text{Jumlah Cek} = \frac{\text{Durasi Garansi}}{\text{Interval Cek}}$Contoh: Garansi 12 Bulan, Interval 3 Bulan $\rightarrow$ Jatuh tempo pada Bulan ke-3, 6, 9, dan 12 dari Tanggal Pembelian.FR-3: Dashboard Reminder Bulanan (Read & Filter)Tampilan utama untuk menyortir pelanggan yang harus dikontak:Filter Utama: Bulan & Tahun (Default: Bulan & Tahun berjalan).Filter Tambahan: Kategori Aki, Pencarian Nama / No Plat.Tabel Informasi: Nama Customer, No HP, Plat Mobil, Kategori Aki, Tanggal Cek Ke-X, Status Garansi (Aktif / Expired).FR-4: Ekspor Data ke Excel / SpreadsheetTombol "Download Spreadsheet Reminder" di halaman Dashboard.Mengekspor data hasil filter periode yang sedang dipilih ke file .xlsx.Format kolom output Excel: No, Nama Customer, No Handphone, No Polisi Mobil, Kategori Aki, Jadwal Cek Ke-, Tanggal Jatuh Tempo.FR-5: Manajemen Data Pelanggan (Update & Delete)Edit Data: Mengubah Nama, No HP, Plat Mobil, atau status garansi.Hapus Data: Menghapus data pelanggan jika klaim batal/salah input dengan modal konfirmasi keamanan.4. Skema Database (Prisma Schema Specification)datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Customer {
  id                     String         @id @default(uuid())
  name                   String
  phone                  String
  licensePlate           String
  batteryCategory        String         // "MF_ISS_LN", "CALCIUM", "HYBRID", "OTHER"
  batteryModel           String?
  purchaseDate           DateTime
  warrantyDurationMonths Int            // 6, 12, 18, 24
  checkIntervalMonths    Int            // 2, 3
  status                 String         @default("ACTIVE") // "ACTIVE", "EXPIRED"
  checkSchedules         CheckSchedule[]
  createdAt              DateTime       @default(now())
  updatedAt              DateTime       @updatedAt
}

model CheckSchedule {
  id           String    @id @default(uuid())
  customerId   String
  customer     Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  checkOrder   Int       // Cek Ke-1, Ke-2, dst.
  dueDate      DateTime  // Tanggal Jatuh Tempo Cek
  isCompleted  Boolean   @default(false)
  createdAt    DateTime  @default(now())
}
5. Rencana Eksekusi Antigravity IDE (/plan)Rencana tugas bertahap berikut dirancang untuk dieksekusi oleh AI Agent di Antigravity IDE:### Task 1: Scaffold Next.js App & Dependencies
- [ ] Initialize Next.js app with TypeScript, Tailwind CSS, App Router.
- [ ] Install Prisma, @prisma/client, date-fns, xlsx, lucide-react, shadcn-ui components.
- [ ] Setup Prisma database schema & run migration (`prisma migrate dev`).

### Task 2: Build Database Utility & Seed Script
- [ ] Create database connection client (`lib/prisma.ts`).
- [ ] Create schedule generator utility (`lib/schedule.ts`) using date-fns to generate `CheckSchedule` records based on purchase date and interval.
- [ ] Create seed script (`prisma/seed.ts`) using sample data from the current Excel sheet (MF/ISS/LN and Calcium categories).

### Task 3: API Routes Implementation
- [ ] `POST /api/customers`: Create customer & generate automatic check schedules.
- [ ] `GET /api/customers`: Fetch customers with optional search & pagination.
- [ ] `PUT /api/customers/[id]`: Update customer information (Name, Phone, License Plate).
- [ ] `DELETE /api/customers/[id]`: Delete customer and cascade schedule records.
- [ ] `GET /api/reminders`: Fetch reminders filtered by `month` and `year`.
- [ ] `GET /api/reminders/export`: Generate and stream `.xlsx` spreadsheet download.

### Task 4: Frontend Component & Page Development
- [ ] `Layout & Navigation`: Sidebar / Navbar navigation for Dashboard, Customer List, Add Transaction.
- [ ] `Dashboard View`: Month & Year selector, metric cards (Total Reminder Month, Active Warranties), and data table.
- [ ] `Customer Form`: Modal / Page to add new customer transaction with interval & warranty selections.
- [ ] `Customer Management Table`: Data table with inline search, edit modal, and delete confirmation.
- [ ] `Export Button Component`: Trigger `.xlsx` file download.

### Task 5: Agent Browser Verification & Testing
- [ ] Test form submission with a new customer (verify correct `CheckSchedule` rows created in DB).
- [ ] Test filtering reminders for target month (e.g., Maret 2026, September 2026).
- [ ] Test `.xlsx` file generation and verify column outputs.
- [ ] Test editing customer details and deleting records.
6. Prompt Instruksi Utama untuk Antigravity IDE AgentGunakan prompt berikut saat memulai sesi pembangunan di Antigravity IDE:Prompt Antigravity Agent:
"Halo Agent, tolong baca dokumen PRD ini (prd.md). Implementasikan aplikasi RemindAki secara penuh menggunakan Next.js App Router, Tailwind CSS, Prisma dengan SQLite, dan xlsx untuk ekspor file. Ikuti skema database dan tahapan pembangunan yang ada pada bagian /plan di prd.md. Pastikan algoritma kalkulasi jadwal cek rutin menghitung tanggal jatuh tempo dengan akurat dari tanggal pembelian. Setelah selesai, jalankan browser agent untuk memverifikasi input data dan pengunduhan spreadsheet."