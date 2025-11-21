# Stock Counting System - Project Documentation

## 📑 สารบัญ

### 📋 ภาพรวมโปรเจค
- [ภาพรวมโปรเจค](#ภาพรวมโปรเจค)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
  - [Backend (StockCountBack)](#backend-stockcountback)
  - [Frontend (StockCountFront)](#frontend-stockcountfront)

### 🗄️ ฐานข้อมูล
- [โครงสร้างฐานข้อมูล](#โครงสร้างฐานข้อมูล)
  - [ntf_User](#ntf_user) - ผู้ใช้งานระบบ
  - [ntf_WhsGroup](#ntf_whsgroup) - คลังสินค้า
  - [ntf_Location](#ntf_location) - Bin Location
  - [ntf_BinMapping](#ntf_binmapping) - การ Mapping SKU/Batch กับ Location
  - [ntf_CountPerson](#ntf_countperson) - ผู้นับ Stock
  - [ntf_FreezeData](#ntf_freezedata) - ข้อมูลต้นฉบับก่อนนับ
  - [ntf_Counting](#ntf_counting) - ข้อมูลการนับจริง

### 🏗️ โครงสร้างโปรเจค
- [โครงสร้างโปรเจค Backend](#โครงสร้างโปรเจค-backend)
- [โครงสร้างโปรเจค Frontend](#โครงสร้างโปรเจค-frontend)

### 🔌 API Endpoints
- [Authentication (`/api/auth`)](#authentication-apiauth) - Login, Register, Change Password
- [Warehouse (`/api/warehouses`)](#warehouse-apiwarehouses) - จัดการคลัง
- [Location (`/api/locations`)](#location-apilocations) - จัดการ Bin Location
- [Bin Mapping (`/api/bin-mappings`)](#bin-mapping-apibin-mappings) - สแกนและจัดการ Mapping
- [User Management (`/api/users`)](#user-management-apiusers) - จัดการผู้ใช้
- [Count Person (`/api/count-persons`)](#count-person-apicount-persons) - จัดการผู้นับ
- [Freeze Data (`/api/freeze-data`)](#freeze-data-apifreeze-data) - จัดการข้อมูลต้นฉบับ + TSV Import
- [Counting (`/api/counting`)](#phase-1-scan-count-system-หน้าจอนับ-stock-จริง-) - บันทึกการนับ Stock
- [Dashboard (`/api/dashboard`)](#phase-15-dashboard--analytics--ทำเสร็จแล้ว) - ภาพรวมและวิเคราะห์

### 📱 ฟีเจอร์และหน้าจอ
- [Phase 0: Preparation](#การทำงานของระบบ-scan-bin-mapping)
  - [Scan Bin Mapping](#การทำงานของระบบ-scan-bin-mapping) - บันทึก SKU/Batch ใน Location
  - [Master Data Management](#master-data-management-pages-admin-only) - จัดการคลัง, Location, ผู้นับ
  - [Freeze Data Management](#3-bin-mapping-management-masterbinmapping) - นำเข้าข้อมูลต้นฉบับ
- [Phase 1: Actual Counting](#phase-1-scan-count-system-หน้าจอนับ-stock-จริง-) ⭐
  - [Scan Count Page](#scan-count-page-scancount) - นับ Stock จริงด้วย Scanner
- [Phase 1.5: Dashboard & Analytics](#phase-15-dashboard--analytics--ทำเสร็จแล้ว) ✅
  - [Dashboard Page](#dashboard-page-dashboard) - ภาพรวมผู้บริหาร + Variance Detection

### 🎨 UI/UX Design
- [UI Components](#ui-components) - Combobox, Button, Dialog
- [UX Best Practices](#uxux-best-practices-สำหรับหน้า-scan) - Auto-focus, Validation, Error Recovery
- [UI Design System](#ui-design-system) - สี, Typography, Components

### 🔐 Security & Configuration
- [Security Features](#security-features) - Authentication, JWT, Authorization
- [Database Connection](#database-connection)
- [CORS Configuration](#cors-configuration)

### 🚀 การติดตั้งและใช้งาน
- [การติดตั้งและรัน](#การติดตั้งและรัน)
- [Troubleshooting](#troubleshooting)

### ✅ สถานะโปรเจค
- [ฟีเจอร์ที่ทำเสร็จแล้ว](#ฟีเจอร์ที่ทำเสร็จแล้ว)
- [ฟีเจอร์ที่ยังไม่ทำ (TODO)](#ฟีเจอร์ที่ยังไม่ทำ-todo)
- [การต่อยอดในอนาคต](#การต่อยอดในอนาคต)

---

## ภาพรวมโปรเจค

ระบบนับ Stock สิ้นปี ครบวงจร ตั้งแต่การเตรียมการ (Bin Mapping) → การนับจริง (Scan Count) → ภาพรวมผู้บริหาร (Dashboard)

**🎯 วัตถุประสงค์:**
- Phase 0: เตรียมการ - บันทึก SKU และ Batch Number ลงใน Bin Location ก่อนการนับ Stock จริง
- Phase 1: นับ Stock จริง - ใช้ Scanner เพื่อบันทึกข้อมูลการนับแบบ real-time
- Phase 1.5: Dashboard - ติดตามความคืบหน้า วิเคราะห์ความแม่นยำ และตรวจจับยอดไม่ตรง

## เทคโนโลยีที่ใช้

### Backend (StockCountBack)
- **.NET 10.0** - Web API Framework
- **Entity Framework Core 10.0** - ORM สำหรับ SQL Server
- **SQL Server** - Database
- **BCrypt.Net** - Password Hashing
- **JWT Bearer Authentication** - การยืนยันตัวตน
- **Minimal API** - รูปแบบ API

### Frontend (StockCountFront)
- **React 19** + **Vite 7**
- **TypeScript**
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI Components
  - Button, Dialog, Popover
  - Combobox (searchable dropdown)
  - Command (cmdk)
- **React Router v6** - Routing
- **Redux Toolkit** - State Management
- **Axios** - HTTP Client
- **Lucide React** - Icons
- **Radix UI** - Headless UI primitives

## โครงสร้างฐานข้อมูล

### ntf_User
เก็บข้อมูลผู้ใช้งานระบบ
```
- id (PK, int)
- userName (varchar(50))
- userPassword (varchar(255)) - เข้ารหัสด้วย BCrypt
- fullName (varchar(150))
- role (varchar(20)) - "admin" หรือ "staff"
- createdAt (datetime)
```

### ntf_WhsGroup
เก็บข้อมูลคลังสินค้า
```
- id (PK, int)
- whsName (varchar(50))
- createdAt (datetime)
```

### ntf_Location
เก็บข้อมูล Bin Location ในแต่ละคลัง
```
- id (PK, int)
- whsId (varchar(50))
- binLocation (varchar(50)) - เช่น A1, A2, B1
- createdAt (datetime)
```

### ntf_BinMapping
เก็บการ mapping ระหว่าง SKU+Batch กับ Location
```
- id (PK, int)
- binId (int) - FK to ntf_Location
- sku (varchar(50))
- batchNo (varchar(50))
- userId (int) - ผู้บันทึก
- createdAt (datetime)
- UNIQUE INDEX (binId, sku, batchNo) - ป้องกันซ้ำ
```

### ntf_CountPerson
เก็บข้อมูลผู้นับ Stock
```
- id (PK, int)
- fullName (varchar(150))
- createdAt (datetime)
```

### ntf_FreezeData
เก็บข้อมูล Stock ต้นฉบับก่อนนับ (สำหรับเปรียบเทียบ)
```
- id (PK, int)
- whsId (int) - FK to ntf_WhsGroup
- binId (int, nullable) - FK to ntf_Location - เพิ่มเพื่อรองรับการเทียบกับ Counting ที่ระดับ Location
- sku (varchar(50))
- batchNo (varchar(50), nullable)
- qty (numeric(15,5))
- uom (varchar(30)) - หน่วยนับ
- unitPrice (numeric(15,5))
- createdAt (datetime)
```

### ntf_Counting
เก็บข้อมูลการนับ Stock จริง (Phase 1)
```
- id (PK, int)
- whsId (int) - FK to ntf_WhsGroup
- binId (int, nullable) - FK to ntf_Location (บางคลังไม่มี location)
- sku (varchar(50))
- batchNo (varchar(50), nullable) - บาง SKU ไม่มี batch
- qty (numeric(15,5))
- countPersonId (int) - ผู้นับ (FK to ntf_CountPerson)
- scanPersonId (int) - ผู้ scan (FK to ntf_User)
- createdAt (datetime)
```

## โครงสร้างโปรเจค Backend

```
StockCountBack/
├── Data/
│   └── StockCountDbContext.cs          # EF Core DbContext
├── Models/
│   ├── NtfUser.cs                      # User Entity
│   ├── NtfWhsGroup.cs                  # Warehouse Entity
│   ├── NtfLocation.cs                  # Location Entity
│   ├── NtfBinMapping.cs                # BinMapping Entity
│   ├── NtfCountPerson.cs               # CountPerson Entity
│   ├── NtfFreezeData.cs                # FreezeData Entity
│   └── NtfCounting.cs                  # Counting Entity (Phase 1)
├── DTOs/
│   └── ApiDtos.cs                      # Data Transfer Objects
├── Services/
│   ├── AuthService.cs                  # Authentication & Password Service (JWT 14h)
│   └── DatabaseSeeder.cs               # Database Seeding
├── Middleware/
│   └── JwtRefreshMiddleware.cs         # JWT Auto-Refresh (< 4h remaining)
├── Endpoints/
│   ├── AuthEndpoints.cs                # /api/auth/*
│   ├── WarehouseEndpoints.cs           # /api/warehouses/*
│   ├── CountPersonEndpoints.cs         # /api/count-persons/*
│   ├── FreezeDataEndpoints.cs          # /api/freeze-data/*
│   ├── CountingEndpoints.cs            # /api/counting/* (Phase 1)
│   ├── LocationEndpoints.cs            # /api/locations/*
│   ├── BinMappingEndpoints.cs          # /api/bin-mappings/*
│   └── UserEndpoints.cs                # /api/users/*
├── Program.cs                          # Main application entry
└── appsettings.Development.json        # Configuration
```

## โครงสร้างโปรเจค Frontend

```
StockCountFront/
├── src/
│   ├── api/
│   │   ├── client.ts                   # Axios instance with interceptors
│   │   └── index.ts                    # API services (all endpoints)
│   ├── redux/
│   │   ├── store.ts                    # Redux store
│   │   ├── authSlice.ts                # Authentication state
│   │   └── hooks.ts                    # Typed Redux hooks
│   ├── layouts/
│   │   └── DashboardLayout.tsx         # Main dashboard layout with sidebar
│   ├── components/
│   │   ├── ProtectedRoute.tsx          # Route guard
│   │   └── ui/                         # shadcn components
│   │       ├── button.tsx
│   │       ├── combobox.tsx            # Searchable dropdown (select2-like)
│   │       ├── command.tsx             # Command palette
│   │       ├── dialog.tsx              # Modal dialogs
│   │       ├── popover.tsx             # Popover component
│   │       └── ...
│   ├── pages/
│   │   ├── LoginPage.tsx               # หน้า Login
│   │   ├── DashboardPage.tsx           # หน้า Dashboard (TODO)
│   │   ├── ScanBinMappingPage.tsx      # หน้าสแกน Bin Mapping (Phase 0)
│   │   ├── ScanCountPage.tsx           # หน้าสแกนนับ Stock (Phase 1) ⭐
│   │   ├── WarehouseManagementPage.tsx # จัดการคลัง (Admin)
│   │   ├── LocationManagementPage.tsx  # จัดการ Location (Admin)
│   │   ├── BinMappingManagementPage.tsx # ดู/ลบ Mapping
│   │   ├── CountPersonManagementPage.tsx # จัดการผู้นับ (Admin)
│   │   ├── FreezeDataManagementPage.tsx # จัดการข้อมูลต้นฉบับ + TSV Import (Admin)
│   │   └── UserManagementPage.tsx      # จัดการผู้ใช้ (Admin)
│   ├── lib/
│   │   └── utils.ts                    # Utility functions
│   ├── App.tsx                         # Main app with routing
│   ├── main.tsx                        # Entry point
│   └── index.css                       # Global styles (Tailwind v4)
├── components.json                     # shadcn config
├── vite.config.ts                      # Vite config
└── package.json
```

## API Endpoints

### Authentication (`/api/auth`)

#### POST /api/auth/login
Login เข้าสู่ระบบ
```json
Request:
{
  "userName": "admin",
  "password": "Admin@2025"
}

Response:
{
  "id": 1,
  "userName": "admin",
  "fullName": "System Administrator",
  "role": "admin",
  "token": "eyJhbGc..."
}
```

#### POST /api/auth/register
สร้างผู้ใช้ใหม่ (Admin only)
```json
Request:
{
  "userName": "staff01",
  "password": "Pass@123",
  "fullName": "Staff Name",
  "role": "staff"
}
```

#### GET /api/auth/me
ดึงข้อมูลผู้ใช้ปัจจุบัน (ต้อง login)

#### POST /api/auth/change-password
เปลี่ยนรหัสผ่าน
```json
Request:
{
  "oldPassword": "Old@123",
  "newPassword": "New@456"
}
```

#### POST /api/auth/logout
Logout ออกจากระบบ

### Warehouse (`/api/warehouses`)

#### GET /api/warehouses
ดึงรายการคลังทั้งหมด

#### GET /api/warehouses/{id}
ดึงข้อมูลคลังตาม ID

#### POST /api/warehouses
สร้างคลังใหม่ (Admin only)
```json
Request:
{
  "whsName": "WH_MILL"
}
```

#### PUT /api/warehouses/{id}
แก้ไขคลัง (Admin only)

#### DELETE /api/warehouses/{id}
ลบคลัง (Admin only)

### Location (`/api/locations`)

#### GET /api/locations?whsId={whsId}
ดึงรายการ Bin Location (filter ตาม warehouse ได้)

#### GET /api/locations/{id}
ดึงข้อมูล Location ตาม ID

#### POST /api/locations
สร้าง Location ใหม่ (Admin only)
```json
Request:
{
  "whsId": "1",
  "binLocation": "A1"
}
```

#### PUT /api/locations/{id}
แก้ไข Location (Admin only)

#### DELETE /api/locations/{id}
ลบ Location (Admin only)

### Bin Mapping (`/api/bin-mappings`)

#### GET /api/bin-mappings?binId={binId}
ดึงรายการ Bin Mapping (filter ตาม binId ได้)

#### GET /api/bin-mappings/{id}
ดึงข้อมูล Mapping ตาม ID

#### POST /api/bin-mappings/scan
**สแกน Label และบันทึก** (หน้าที่หลักของ Phase 0)
```json
Request:
{
  "binId": 1,
  "scannedData": "|3012-001_AN_6063/T5_MILL|E7-01-00001|"
}

Response:
{
  "id": 1,
  "binId": 1,
  "sku": "3012-001_AN_6063/T5_MILL",
  "batchNo": "E7-01-00001",
  "userId": 1,
  "createdAt": "2025-11-20T09:30:00"
}

Error (409 Conflict) ถ้าซ้ำ:
{
  "error": "This SKU and batch number already mapped to this bin location"
}
```

**การทำงาน:**
1. แยก scannedData ตาม `|` delimiter
2. ส่วนแรก = SKU, ส่วนที่สอง = batchNo
3. เช็คว่าซ้ำหรือไม่ (binId + sku + batchNo)
4. บันทึกพร้อมเก็บ userId ของผู้สแกน

#### POST /api/bin-mappings
สร้าง Mapping แบบ Manual
```json
Request:
{
  "binId": 1,
  "sku": "3012-001",
  "batchNo": "E7-01-00001"
}
```

#### DELETE /api/bin-mappings/{id}
ลบ Mapping (Admin only)

### User Management (`/api/users`) - Admin Only

#### GET /api/users
ดึงรายการผู้ใช้ทั้งหมด

#### GET /api/users/{id}
ดึงข้อมูลผู้ใช้ตาม ID

#### POST /api/users
สร้างผู้ใช้ใหม่

#### PUT /api/users/{id}
แก้ไขข้อมูลผู้ใช้

#### DELETE /api/users/{id}
ลบผู้ใช้ (ลบ admin ไม่ได้)

#### POST /api/users/{id}/reset-password
รีเซ็ตรหัสผ่านผู้ใช้

### Count Person (`/api/count-persons`) - Admin Only

#### GET /api/count-persons
ดึงรายการผู้นับ Stock ทั้งหมด

#### GET /api/count-persons/{id}
ดึงข้อมูลผู้นับตาม ID

#### POST /api/count-persons
สร้างผู้นับใหม่
```json
Request:
{
  "fullName": "John Doe"
}
```

#### PUT /api/count-persons/{id}
แก้ไขข้อมูลผู้นับ

#### DELETE /api/count-persons/{id}
ลบผู้นับ

### Freeze Data (`/api/freeze-data`) - Admin Only

#### GET /api/freeze-data?whsId={whsId}
ดึงข้อมูล Freeze Data (filter ตาม warehouse ได้)

#### GET /api/freeze-data/{id}
ดึงข้อมูล Freeze Data ตาม ID

#### POST /api/freeze-data/import
**นำเข้าไฟล์ TSV สำหรับคลังที่ระบุ** (แทนที่ข้อมูลเก่าทั้งหมด)
```json
Request:
{
  "whsId": 1,
  "tsvContent": "SKU\tBatchNo\tQty\tUom\tUnitPrice\n3012-001\tE7-01\t100.50\tKG\t50.00"
}

Response:
{
  "message": "Import completed",
  "whsId": 1,
  "importedCount": 150,
  "deletedCount": 120,
  "errors": null
}
```

**รูปแบบ TSV:**
- แถวแรก: Header (skip)
- คอลัมน์: SKU [TAB] BatchNo [TAB] Qty [TAB] Uom [TAB] UnitPrice
- ใช้ Tab เป็น delimiter

**การทำงาน:**
1. ลบข้อมูลเก่าทั้งหมดของคลังนี้
2. อ่านและ parse TSV content
3. Insert ข้อมูลใหม่ทั้งหมด
4. คืนค่าสรุปผลการ import

#### DELETE /api/freeze-data/warehouse/{whsId}
ลบข้อมูล Freeze Data ทั้งหมดของคลังที่ระบุ

#### DELETE /api/freeze-data/{id}
ลบข้อมูล Freeze Data เฉพาะรายการที่ระบุ

## การติดตั้งและรัน

### Backend

```bash
cd StockCountBack

# Restore packages
dotnet restore

# Run migrations (ถ้ามี)
dotnet ef database update

# Run application
dotnet run
```

Backend จะรันที่ `http://localhost:5121`

**Admin User:**
- Username: `admin`
- Password: `Admin@2025`

### Frontend

```bash
cd StockCountFront

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend จะรันที่ `http://localhost:5173`

## ฟีเจอร์ที่ทำเสร็จแล้ว

✅ Backend (Phase 0 + Phase 1)
- Authentication System (Login/Register/JWT with HTTP-only cookies)
- Password Hashing (BCrypt cost 12)
- JWT Auto-refresh middleware (14h expiration, refresh < 4h)
- Session verification on app load
- CRUD APIs สำหรับ Warehouse, Location, BinMapping, User
- **Count Person API** - จัดการผู้นับ Stock
- **Freeze Data API** - จัดการข้อมูลต้นฉบับ พร้อม TSV Import
- **Counting API** - บันทึกการนับ Stock จริง (Phase 1) ⭐
- Scan Label Endpoint พร้อม parser |SKU|batchNo|
- Duplicate checking
- Role-based Authorization (admin/staff)
- Database Seeding (admin user)
- Removed deprecated WithOpenApi() methods

✅ Frontend (Phase 0 + Phase 1)
- Login Page (พร้อม gradient background สีแบรนด์)
- Protected Routes (auto-redirect ถ้าไม่ได้ login)
- Dashboard Layout with Sidebar
  - Scrollable sidebar (auto-hide scrollbar)
  - Active route highlighting
  - สีส้ม ALUMET gradient
- Redux State Management
  - Auth state with user restore from localStorage
  - Session verification on app load (/api/auth/me)
  - Loading state during verification
- Axios API Client
  - JWT Auto-refresh (รับ token ใหม่อัตโนมัติ)
  - Session expiration handling (alert + redirect)
  - Token storage: HTTP-only cookie + localStorage
  - withCredentials: true for cookie support
- **Scan Bin Mapping Page** (Phase 0)
  - Auto-focus & clear pattern
  - Validation & immediate feedback
  - Error handling with recovery
- ✅ **Scan Count Page** (Phase 1) ⭐ **[ทำเสร็จแล้ว]**
  - ✅ Scan Warehouse/Location จาก QR มุมขวาบน
  - ✅ เลือกผู้นับจาก dropdown
  - ✅ Scan SKU/Batch จาก Data Matrix
  - ✅ กรอกจำนวนและบันทึก
  - ✅ แสดงตารางรายการที่นับแล้วแบบ real-time
  - ✅ แก้ไขจำนวนแบบ inline editing (with audit trail)
  - ✅ ลบรายการ (with confirmation)
  - ✅ Reset flow เพื่อเริ่มใบใหม่
  - ✅ รองรับกรณีไม่มี Location/BatchNo
  - ✅ Smart Focus Management (error→same field, success→next field)
  - ✅ Early Duplicate Detection (ก่อนกรอกจำนวน)
  - ✅ Sticker-Style Messages (success auto-clear 1.5s)
  - ✅ State Persistence (โหลดรายการเดิมเมื่อกลับมา scan ซ้ำ)
  - ✅ Audit Trail (updatedAt, updatedBy with user name)
  - ✅ Button-based workflow (no Enter key conflicts)
  - ✅ Enhanced Display (scanPersonName, split date/time)
- **Master Data Pages** (Admin only):
  - ✅ Warehouse Management (CRUD)
  - ✅ Bin Location Management (CRUD with filter)
  - ✅ Bin Mapping Management (View/Delete with filters)
  - ✅ **Count Person Management** (CRUD ผู้นับ Stock)
  - ✅ **Freeze Data Management** (จัดการข้อมูลต้นฉบับ + TSV Import)
    - Upload TSV file
    - แยกคลัง (per warehouse)
    - Replace old data when re-import
- **Admin Pages**:
  - ✅ User Management (CRUD + Reset Password)

## ฟีเจอร์ที่ยังไม่ทำ (TODO)

Phase 1 Complete ✅:
- [x] Scan Count Page - ทำเสร็จแล้ว พร้อมใช้งาน
- [x] Dashboard Page - ทำเสร็จแล้ว พร้อมใช้งาน ⭐

Phase 2 (ยังไม่เริ่ม):
- [ ] Export Excel Reports
- [ ] Advanced Analytics
- [ ] Email Notifications

## การทำงานของระบบ Scan Bin Mapping

### User Flow
1. พนักงานเปิดหน้า **Scan Bin Mapping**
2. เลือก **Warehouse** (เช่น WH_MILL)
3. เลือก **Bin Location** (เช่น A1)
4. Scan label ที่ติดอยู่บนสินค้า (เชื่อม barcode scanner)
5. Label จะมีรูปแบบ: `|SKU|batchNumber|`
   - ตัวอย่าง: `|3012-001_AN_6063/T5_MILL|E7-01-00001|`
6. กด **บันทึก** (หรือ Enter)
7. ระบบจะ:
   - แยก SKU และ BatchNo จาก scanned data
   - เช็คว่าซ้ำหรือไม่
   - บันทึกลง database พร้อม userId
8. แสดงผลว่า "บันทึกสำเร็จ" หรือ "ซ้ำ"

### UX Best Practices สำหรับหน้า Scan

**การออกแบบเพื่อประสิทธิภาพในการสแกน:**

#### 1. Auto Focus & Clear Pattern
```typescript
// หลังบันทึกสำเร็จ
setScannedData('');           // เคลียร์ช่อง input
scanInputRef.current?.focus(); // Focus กลับไปที่ช่อง scan ทันที
```

**เหตุผล:** ให้ผู้ใช้สามารถสแกนต่อเนื่องได้ทันทีโดยไม่ต้องคลิกหรือกด Tab

#### 2. Validation & Immediate Feedback
```typescript
// ตรวจสอบรูปแบบ label ก่อนส่ง backend
if (!scannedData.startsWith('|')) {
  setError('ตรวจสอบ sticker หรือ ภาษาของ keyboard');
  setScannedData('');           // เคลียร์ข้อมูลผิด
  scanInputRef.current?.focus(); // พร้อม scan ใหม่ทันที
  return;
}
```

**เหตุผล:** 
- ป้องกันปัญหา keyboard เป็นภาษาไทย (| จะกลายเป็น ฃ)
- ป้องกันการส่งข้อมูลผิดรูปแบบไป backend
- ประหยัดเวลา - ไม่ต้องรอ API response ถ้ารู้ว่าผิดแน่ๆ

#### 3. Error Handling with Recovery
```typescript
try {
  await binMappingAPI.scan(selectedLocation, scannedData);
  setMessage('บันทึกสำเร็จ!');
  setScannedData('');
  scanInputRef.current?.focus();
} catch (err: any) {
  if (err.response?.status === 409) {
    setError('SKU และ Batch Number นี้ถูกบันทึกไว้แล้ว');
  } else {
    setError(err.response?.data?.error || 'บันทึกไม่สำเร็จ');
  }
  setScannedData('');           // เคลียร์แม้ error
  scanInputRef.current?.focus(); // พร้อม scan ต่อทันที
}
```

**เหตุผล:**
- แม้เจอ error (เช่น ข้อมูลซ้ำ) ก็ให้เคลียร์และพร้อม scan ต่อ
- ไม่ทำให้ผู้ใช้ต้องลบข้อมูลเก่าเอง
- เพิ่มความเร็วในการทำงานต่อเนื่อง

#### 4. Visual Feedback
```tsx
{message && (
  <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
    {message}
  </div>
)}

{error && (
  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
    {error}
  </div>
)}
```

**เหตุผล:**
- ให้ feedback ชัดเจนว่าสำเร็จหรือ error
- ใช้สีเพื่อแยกแยะสถานะ (เขียว = สำเร็จ, แดง = error)

#### 5. Input Type & Auto-Focus
```tsx
<input
  ref={scanInputRef}
  type="text"
  value={scannedData}
  onChange={(e) => setScannedData(e.target.value)}
  className="w-full px-3 py-2 border rounded-md font-mono"
  placeholder="|3012-001_AN_6063/T5_MILL|E7-01-00001|"
  required
  autoFocus  // Focus ทันทีที่เข้าหน้า
/>
```

**เหตุผล:**
- `autoFocus` = พร้อมใช้งานทันทีที่เข้าหน้า
- `font-mono` = ง่ายต่อการอ่านรูปแบบ barcode
- `placeholder` = แสดงตัวอย่างให้เห็นรูปแบบที่ถูกต้อง

### สรุป UX Pattern สำหรับหน้า Scan

| สถานการณ์ | การทำงานของระบบ | เหตุผล |
|-----------|-----------------|--------|
| **บันทึกสำเร็จ** | เคลียร์ช่อง + Focus + แสดงข้อความสีเขียว | ให้สแกนต่อได้ทันที |
| **รูปแบบผิด** (ไม่ขึ้นต้นด้วย \|) | แจ้งเตือน + เคลียร์ช่อง + Focus | ป้องกัน keyboard ภาษาไทย/sticker ผิด |
| **ข้อมูลซ้ำ** (409) | แจ้งเตือนสีแดง + เคลียร์ช่อง + Focus | ให้สแกนใบใหม่ได้ทันที |
| **Error อื่นๆ** | แจ้งเตือนสีแดง + เคลียร์ช่อง + Focus | Recovery ให้ทำงานต่อได้ |
| **เข้าหน้าใหม่** | Auto-focus ที่ช่อง scan | เริ่มทำงานได้ทันที |

## Master Data Management Pages (Admin Only)

### 1. Warehouse Management (`/master/warehouse`)
**ฟีเจอร์:**
- ดูรายการคลังทั้งหมด (Table view)
- เพิ่มคลังใหม่ (Inline form)
- แก้ไขชื่อคลัง (Inline edit)
- ลบคลัง
- Authorization: เฉพาะ admin เท่านั้น

**หน้าตา:**
```
+----+------------+---------------------+--------+
| ID | ชื่อคลัง   | วันที่สร้าง        | จัดการ  |
+----+------------+---------------------+--------+
| 1  | WH_MILL    | 20/11/2025 09:00   | แก้ไข ลบ |
| 2  | WH_PAINT   | 20/11/2025 10:30   | แก้ไข ลบ |
+----+------------+---------------------+--------+
```

## UI Components

### Combobox Component (Searchable Dropdown)
**ใช้งานแทน `<select>` ธรรมดาเมื่อมีตัวเลือกจำนวนมาก**

**ฟีเจอร์:**
- พิมพ์เพื่อค้นหา (fuzzy search)
- แสดงเครื่องหมาย ✓ ข้างตัวเลือกที่เลือกอยู่
- รองรับ keyboard navigation (↑↓ เลือก, Enter ยืนยัน, Esc ปิด)
- Accessible (ARIA compliant)
- Mobile-friendly

**ตัวอย่างการใช้งาน:**
```tsx
import { Combobox } from '@/components/ui/combobox';

<Combobox
  options={[
    { value: '1', label: 'D1A-01' },
    { value: '2', label: 'D1A-02' },
    { value: '3', label: 'D22C-06' },
  ]}
  value={selectedValue}
  onValueChange={setSelectedValue}
  placeholder="เลือก Bin Location"
  searchPlaceholder="ค้นหา location..."
  emptyText="ไม่พบ location"
/>
```

**ใช้ใน:**
- Scan Bin Mapping Page (เลือก Bin Location)
- Location Management Page (filter dropdown)
- Bin Mapping Management Page (filter dropdown)

### 2. Bin Location Management (`/master/bin-location`)
**ฟีเจอร์:**
- ดูรายการ Location ทั้งหมด (Table view)
- กรองตามคลัง (Filter dropdown)
- เพิ่ม Location ใหม่ (Form: เลือกคลัง + กรอก bin location)
- แก้ไข Location (Inline edit)
- ลบ Location
- Authorization: เฉพาะ admin เท่านั้น

**หน้าตา:**
```
Filter: [Warehouse Dropdown ▼] [All / WH_MILL / WH_PAINT]

+----+---------+---------------+---------------------+--------+
| ID | คลัง    | Bin Location  | วันที่สร้าง        | จัดการ  |
+----+---------+---------------+---------------------+--------+
| 1  | WH_MILL | A1            | 20/11/2025 09:00   | แก้ไข ลบ |
| 2  | WH_MILL | A2            | 20/11/2025 09:05   | แก้ไข ลบ |
| 3  | WH_MILL | B1            | 20/11/2025 09:10   | แก้ไข ลบ |
+----+---------+---------------+---------------------+--------+
```

### 3. Bin Mapping Management (`/master/bin-mapping`)
**ฟีเจอร์:**
- ดูรายการ Mapping ทั้งหมด (Table view with scroll)
- กรองตามคลัง (Warehouse dropdown)
- กรองตาม Location (Location dropdown - filtered by warehouse)
- ลบ Mapping (Delete only - ไม่มี Create/Edit)
- แสดง: Location, SKU, Batch No, User ID, วันที่สร้าง
- Authorization: เฉพาะ admin เท่านั้น

**หมายเหตุ:** การเพิ่ม Mapping ให้ใช้หน้า "Scan Bin Mapping" แทน

**หน้าตา:**
```
Filter: [Warehouse ▼] [Location ▼]

+----+-----------------+---------------------------+---------------+--------+---------------------+------+
| ID | Location        | SKU                       | Batch No      | User ID| วันที่สร้าง        | ลบ   |
+----+-----------------+---------------------------+---------------+--------+---------------------+------+
| 1  | WH_MILL - A1    | 3012-001_AN_6063/T5_MILL | E7-01-00001   | 2      | 20/11/2025 11:00   | ลบ   |
| 2  | WH_MILL - A1    | 3012-002_AN_6063/T5_MILL | E7-01-00002   | 2      | 20/11/2025 11:02   | ลบ   |
+----+-----------------+---------------------------+---------------+--------+---------------------+------+
```

## Admin Pages

### User Management (`/admin/users`)
**ฟีเจอร์:**
- ดูรายการผู้ใช้ทั้งหมด (Table view)
- เพิ่มผู้ใช้ใหม่ (Form: username, password, fullName, role)
- แก้ไขผู้ใช้ (Inline edit: fullName, role)
- รีเซ็ตรหัสผ่าน (Prompt for new password)
- ลบผู้ใช้ (ยกเว้น admin user)
- แสดง role badge (Admin = purple, Staff = blue)
- Authorization: เฉพาะ admin เท่านั้น

**หน้าตา:**
```
+----+----------+------------------+-------+---------------------+--------------------------+
| ID | Username | ชื่อ-นามสกุล     | Role  | วันที่สร้าง        | จัดการ                    |
+----+----------+------------------+-------+---------------------+--------------------------+
| 1  | admin    | System Admin     | admin | 20/11/2025 08:00   | แก้ไข รีเซ็ตรหัสผ่าน      |
| 2  | staff01  | John Doe         | staff | 20/11/2025 09:00   | แก้ไข รีเซ็ตรหัสผ่าน ลบ   |
+----+----------+------------------+-------+---------------------+--------------------------+
```

**Business Rules:**
- Username ไม่สามารถแก้ไขได้หลังสร้าง
- Admin user (id=1, username=admin) ลบไม่ได้
- การรีเซ็ตรหัสผ่านจะ prompt ให้กรอกรหัสใหม่
- Role มี 2 แบบ: "admin" และ "staff"

### Count Person Management (`/master/count-person`)
**ฟีเจอร์:**
- ดูรายการผู้นับ Stock ทั้งหมด (Table view)
- เพิ่มผู้นับใหม่ (Inline form)
- แก้ไขชื่อผู้นับ (Inline edit)
- ลบผู้นับ
- Authorization: เฉพาะ admin เท่านั้น

**หน้าตา:**
```
เพิ่มผู้นับใหม่: [ชื่อ-นามสกุล________________] [เพิ่ม]

+----+------------------+---------------------+--------+
| ID | ชื่อ-นามสกุล     | วันที่สร้าง        | จัดการ  |
+----+------------------+---------------------+--------+
| 1  | John Doe         | 20/11/2025 09:00   | แก้ไข ลบ |
| 2  | Jane Smith       | 20/11/2025 09:05   | แก้ไข ลบ |
+----+------------------+---------------------+--------+
```

**Use Case:**
- ใช้สำหรับบันทึกรายชื่อคนที่จะมานับ Stock
- จะนำไปใช้ใน Phase 1 เพื่อระบุว่าใครเป็นคนนับ

### Freeze Data Management (`/master/freeze-data`)
**ฟีเจอร์:**
- เลือกคลัง (Dropdown)
- Upload ไฟล์ TSV (Tab-Separated Values)
- แสดงข้อมูลในตาราง พร้อมจำนวนรายการ
- ลบข้อมูลทั้งหมดของคลัง
- Authorization: เฉพาะ admin เท่านั้น

**หน้าตา:**
```
เลือกคลัง: [WH_MILL ▼]

นำเข้าไฟล์ TSV (Tab-Separated Values)
[โหลดข้อมูล] [เลือกไฟล์] [ลบทั้งหมด]
รูปแบบ: SKU [TAB] BatchNo [TAB] Qty [TAB] Uom [TAB] UnitPrice

ข้อมูลคลัง: WH_MILL (150 รายการ)
+----+---------------------------+---------------+--------+--------+----------+---------------------+
| ID | SKU                       | Batch No      | Qty    | Uom    | UnitPrice| วันที่สร้าง        |
+----+---------------------------+---------------+--------+--------+----------+---------------------+
| 1  | 3012-001_AN_6063/T5_MILL | E7-01-00001   | 100.50 | KG     | 50.00    | 20/11/2025 10:00   |
| 2  | 3012-002_AN_6063/T5_MILL | E7-01-00002   | 200.00 | KG     | 50.00    | 20/11/2025 10:00   |
+----+---------------------------+---------------+--------+--------+----------+---------------------+
```

**การทำงาน:**
1. เลือกคลังที่ต้องการ import
2. เลือกไฟล์ .tsv หรือ .txt
3. ระบบจะ:
   - ลบข้อมูลเก่าของคลังนี้ทั้งหมด
   - อ่านและ parse TSV
   - Insert ข้อมูลใหม่
   - แสดงสรุปผล (นำเข้าสำเร็จ X รายการ, ลบเก่า Y รายการ)
4. แสดงข้อมูลในตาราง

**รูปแบบไฟล์ TSV:**
```tsv
SKU	BatchNo	Qty	Uom	UnitPrice
3012-001_AN_6063/T5_MILL	E7-01-00001	100.50	KG	50.00
3012-002_AN_6063/T5_MILL	E7-01-00002	200.00	KG	50.00
```

**Use Case:**
- ใช้สำหรับนำเข้าข้อมูล Stock ต้นฉบับก่อนเริ่มนับ
- จะนำไปเปรียบเทียบกับยอดนับจริงใน Phase 1
- แยกคลัง - สามารถ import ทีละคลังได้
- Update ได้ - ถ้า import ซ้ำจะแทนที่ข้อมูลเก่า

---

## Phase 1: Scan Count System (หน้าจอนับ Stock จริง) ⭐

### Scan Count Page (`/scan-count`)

หน้าหลักสำหรับการนับ Stock จริง ตาม Stock Count Sheet ที่พิมพ์มา

**ฟีเจอร์:**
- Scan Warehouse/Location จาก QR Code มุมขวาบน
- เลือกผู้นับจาก Dropdown (ระบุว่าใครเป็นคนนับมา)
- Scan SKU/Batch จาก Data Matrix แต่ละรายการ
- กรอกจำนวนที่นับได้จริง
- บันทึกและแสดงรายการที่นับแล้วแบบ real-time
- แก้ไขจำนวนแบบ inline editing
- Reset flow เพื่อเริ่มใบใหม่

**Flow การใช้งาน:**

```
1. Scan QR Code มุมขวาบน
   ├─> รูปแบบ: |WH_MILL|D1B-02|
   ├─> Parse: Warehouse + Location
   └─> แสดงชื่อคลัง/Location ที่เลือก

2. เลือกผู้นับ (Count Person)
   └─> Dropdown แสดงรายชื่อจาก ntf_CountPerson

3. Scan SKU/Batch (Data Matrix)
   ├─> รูปแบบ: |3012-001_AN_6063/T5_MILL|E7-01-00001|
   ├─> Parse: SKU + Batch Number
   └─> Auto-focus ไปที่ช่องจำนวน

4. กรอกจำนวน (Quantity)
   └─> พิมพ์ตัวเลข (รองรับทศนิยม)

5. กดปุ่ม "บันทึก"
   ├─> บันทึกลง ntf_Counting
   ├─> Reset SKU/Batch/Qty
   ├─> Auto-focus กลับไปที่ช่อง Scan SKU
   └─> Reload ตารางด้านล่าง

6. เมื่อจบใบ กด "Reset ใบใหม่"
   └─> Reset ทุกอย่าง กลับไป step 1
```

**หน้าตา UI:**

```
╔══════════════════════════════════════════════════════════════════╗
║  Scan ใบนับ Stock                       [Reset ใบใหม่]          ║
╠══════════════════════════════════════════════════════════════════╣
║  1. Scan Warehouse & Location (มุมขวาบน)                        ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ Scan รหัส QR มุมขวาบน                                       │  ║
║  │ [_____________________________________________] (font-mono)  │  ║
║  │ รูปแบบ: |Warehouse|Location|                                │  ║
║  └────────────────────────────────────────────────────────────┘  ║
║  ✓ คลัง: WH_MILL - Location: D1B-02                             ║
╠══════════════════════════════════════════════════════════════════╣
║  2. เลือกผู้นับ                                                  ║
║  ┌────────────────────────────────────────────────────────────┐  ║
║  │ [นาย สมชาย ใจดี                        ▼]                  │  ║
║  └────────────────────────────────────────────────────────────┘  ║
╠══════════════════════════════════════════════════════════════════╣
║  3. Scan SKU & กรอกจำนวน                                         ║
║  ┌──────────────────────┬───────────────┬───────────────┐        ║
║  │ Scan SKU             │ SKU           │ Batch No      │        ║
║  │ [Scan |SKU|Batch|]   │ 3012-001...   │ E7-01-00001   │        ║
║  └──────────────────────┴───────────────┴───────────────┘        ║
║  ┌──────────────────────────────┐  ┌─────────────┐              ║
║  │ จำนวน: [100.50_____________] │  │  [บันทึก]   │              ║
║  └──────────────────────────────┘  └─────────────┘              ║
╠══════════════════════════════════════════════════════════════════╣
║  รายการที่นับแล้ว: WH_MILL - D1B-02 (5 รายการ)                  ║
║  ┌─────┬──────────────────┬─────────┬─────┬────────┬──────────┐ ║
║  │ ID  │ SKU              │ Batch   │ Qty │ ผู้นับ │ [แก้ไข]  │ ║
║  ├─────┼──────────────────┼─────────┼─────┼────────┼──────────┤ ║
║  │ 101 │ 3012-001_AN...   │ E7-...  │ 100 │ สมชาย  │ [แก้ไข]  │ ║
║  │ 102 │ 3012-002_AN...   │ E7-...  │ 200 │ สมชาย  │ [แก้ไข]  │ ║
║  └─────┴──────────────────┴─────────┴─────┴────────┴──────────┘ ║
╚══════════════════════════════════════════════════════════════════╝
```

**UI/UX Improvements (Phase 1.1):**

1. **ใช้ปุ่มแทน Enter Key**
   - ช่อง Scan Warehouse/Location → มีปุ่ม "ยืนยันคลัง"
   - ช่อง Scan SKU → มีปุ่ม "Scan"
   - ช่องจำนวน → ปิดการทำงาน Enter key
   - ป้องกันการ submit โดยไม่ตั้งใจ

2. **Smart Focus Management**
   - **Error Case**: Focus กลับไปที่ textbox เดิมที่เกิด error
     - Warehouse error → focus ที่ช่อง Warehouse
     - SKU error → focus ที่ช่อง SKU
     - ให้ผู้ใช้แก้ไขได้ทันที
   - **Success Case**: Focus ไปขั้นตอนถัดไป
     - Warehouse success → ไม่ auto-focus (ให้เลือก Count Person)
     - SKU success → focus ที่ช่องจำนวน
     - Save success → แสดง sticker 1.5 วินาที → clear → focus กลับ SKU
   - Flow ราบรื่น ไม่ต้องคลิกเอง

3. **State Persistence & Auto-Reload**
   - ระบบจดจำ Warehouse/Location เมื่อ scan แล้ว
   - เมื่อกลับมา scan |Warehouse|Location| เดิมอีกครั้ง:
     - โหลดรายการที่เคยแสกนมาแสดงอัตโนมัติ
     - ไม่ต้องเริ่มต้นใหม่ สามารถเพิ่มรายการต่อได้เลย
   - Use Case: พนักงานนับเจอของเพิ่ม กลับมานับที่ Location เดิม
   - Implementation: useEffect ติดตาม selectedWhsId, selectedBinId, selectedCountPersonId

4. **Duplicate Check Early (SKU Scan)**
   - เช็คซ้ำทันทีที่ scan SKU (ก่อนกรอกจำนวน)
   - ถ้าซ้ำ → แสดง error + clear + focus กลับ SKU ทันที
   - ประหยัดเวลา ไม่ต้องรอกรอกจำนวนแล้วค่อยรู้ว่าซ้ำ

5. **Unique Constraint Validation**
   - ตรวจสอบ SKU + Batch ต่อ Warehouse (ห้ามซ้ำ)
   - Frontend: เช็คทั้งตอน scan SKU และ ตอน submit
   - Backend: Unique Index + Duplicate check + Conflict response (409)
   - แสดง error message พร้อม ID ของรายการที่ซ้ำ

6. **Sticker-Style Messages**
   - Success: `✅ บันทึกสำเร็จ! SKU: xxx | Batch: xxx | จำนวน: xxx`
     - สีเขียวอ่อน, border หนา, shadow, font ใหญ่
     - แสดง 1.5 วินาที แล้ว clear อัตโนมัติ
   - Error: `❌ ซ้ำ! SKU: xxx Batch: xxx มีในระบบแล้ว (ID: xxx)`
     - สีแดงอ่อน, border หนา, shadow, font ใหญ่
   - เด่นชัด เห็นง่าย สไตล์ sticker

**Validation Rules:**

1. **Warehouse/Location Format**: ต้องเริ่มด้วย `|`
   - ถ้าไม่ใช่ → แสดง error และ reset ช่อง
   - Warehouse ต้องมี → หา ID จากชื่อ
   - Location ไม่บังคับ → ถ้าไม่มีปล่อย null

2. **SKU/Batch Format**: ต้องเริ่มด้วย `|`
   - ถ้าไม่ใช่ → แสดง error และ reset ช่อง (ไม่ reset Warehouse)
   - SKU ต้องมี → ดึงจาก column 0
   - Batch ไม่บังคับ → ดึงจาก column 1 (ถ้าไม่มีปล่อย null)

3. **Quantity**: ต้องเป็นตัวเลข > 0

4. **Count Person**: ต้องเลือกก่อนสแกน SKU

5. **Duplicate Check**: 
   - ต้องไม่ซ้ำ SKU + Batch ในคลังเดียวกัน
   - ตรวจสอบทั้ง Frontend และ Backend
   - แสดง error พร้อม ID ของรายการเดิม

**API Endpoint:**

```
POST /api/counting
{
  "whsId": 1,
  "binId": 25,  // nullable
  "sku": "3012-001_AN_6063/T5_MILL",
  "batchNo": "E7-01-00001",  // nullable
  "qty": 100.50,
  "countPersonId": 5
}

Response (Success - 201):
{
  "id": 123,
  "whsId": 1,
  "binId": 25,
  "sku": "3012-001_AN_6063/T5_MILL",
  "batchNo": "E7-01-00001",
  "qty": 100.50,
  "countPersonId": 5,
  "scanPersonId": 1,  // จาก JWT token
  "createdAt": "2025-11-20T15:30:00"
}

Response (Duplicate - 409):
{
  "error": "SKU '3012-001_AN_6063/T5_MILL' Batch 'E7-01-00001' มีในระบบแล้ว (ID: 99)"
}
```

**Database Constraints:**
- Unique Index: `(whsId, sku, batchNo)` - ป้องกันซ้ำระดับ database
- Nullable: `binId`, `batchNo` - รองรับกรณีไม่มีข้อมูล

**Use Case:**
- ใช้เวลานับ Stock จริง ณ จุดเก็บของ
- พนักงานถือ Scanner เดินไปตาม Stock Count Sheet
- Scan QR มุมขวาบน → เลือกผู้นับ → Scan แต่ละรายการ → กรอกจำนวน
- ข้อมูลจะถูกบันทึกแบบ real-time เข้า Database
- สามารถแก้ไขจำนวนได้ทันที ถ้านับผิด
- เมื่อจบ 1 ใบ กด Reset เพื่อไปใบถัดไป

**หมายเหตุ:**
- `scanPersonId` ดึงมาจาก User ที่ login อยู่ (JWT claim)
- `countPersonId` คือคนที่ไปนับมา (เลือกจาก dropdown)
- รองรับ Warehouse ที่ไม่มี Location (binId = null)
- รองรับ SKU ที่ไม่มี Batch Number (batchNo = null)

---

### เทคนิคสำคัญสำหรับหน้าอื่นๆ ที่มีการ Scan

1. **ใช้ useRef** เพื่อควบคุม focus
   ```typescript
   const scanInputRef = useRef<HTMLInputElement>(null);
   ```

2. **Validate Format ที่ Frontend ก่อน** - ประหยัดเวลา round-trip
   ```typescript
   if (!data.startsWith('expected_pattern')) {
     // Show error immediately
   }
   ```

3. **เคลียร์และ Focus ในทุกกรณี** - ทั้งสำเร็จและ error
   ```typescript
   setInputData('');
   inputRef.current?.focus();
   ```

4. **ใช้ font-mono** สำหรับช่อง input ที่เป็น barcode/code
   ```tsx
   className="font-mono"
   ```

5. **แสดง placeholder ที่เป็นตัวอย่างจริง** - ช่วยให้ user เข้าใจรูปแบบ
   ```tsx
   placeholder="|REAL_EXAMPLE_HERE|"
   ```

6. **Immediate Validation Feedback** - อย่ารอให้กดปุ่ม
   ```tsx
   onChange={(e) => {
     const value = e.target.value;
     setInputData(value);
     // Optional: Real-time validation
     if (value && !value.startsWith('|')) {
       setWarning('ตรวจสอบภาษา keyboard');
     }
   }}
   ```

## Security Features

### Authentication & Authorization
- **Password Hashing**: BCrypt (cost factor 12)
- **JWT Token Authentication**: 
  - Token หมดอายุ: **14 ชั่วโมง**
  - ClockSkew: **Zero** (ไม่มีเวลาผ่อนผัน)
  - Auto-refresh: ต่ออายุอัตโนมัติเมื่อเหลือเวลาน้อยกว่า 4 ชั่วโมง
  - Strict expiration: หมดอายุจริง = เด้งกลับหน้า login ทันที
- **HTTP-only Cookies**: 
  - Cookie name: `jwt`
  - HttpOnly: `true` (ป้องกัน JavaScript access)
  - Secure: `false` (dev), `true` (production)
  - SameSite: `Lax` (ป้องกัน CSRF)
  - Expires: 14 hours
  - ส่งทั้ง cookie และ response body (backward compatibility)
- **Authorization Middleware**: Role-based (admin/staff)
- **Protected Endpoints**: ต้อง authenticate ทุก endpoint (ยกเว้น login)

### JWT Auto-Refresh Mechanism
```
Timeline:
├─ 0h ────────────────────── Login (14h token)
├─ 10h ─────────────────────┐
│                            │ Token มีอายุเหลือ 4h
│  [Auto-Refresh Triggered] │ ระบบออก token ใหม่อัตโนมัติ
├─ 10h ────────────────────── New Token (14h)
├─ 24h ─────────────────────┐
│                            │ Token หมดอายุจริง
│  [Session Expired]        │ เด้ง login ทันที + แสดง alert
└─ 24h ────────────────────── Redirect to /login
```

**Backend:**
- `JwtRefreshMiddleware`: ตรวจสอบและต่ออายุ token
- `OnAuthenticationFailed`: จับ token หมดอายุ → return 401 + header `Token-Expired: true`
- `ClockSkew = TimeSpan.Zero`: ไม่ให้เวลาผ่อนผัน

**Frontend:**
- Axios Interceptor: รับ token ใหม่จาก header `X-New-Token`
- ตรวจจับ 401 + `Token-Expired` → alert + redirect `/login`
- อัพเดท token ใน localStorage อัตโนมัติ

### Data Protection
- Input validation
- SQL Injection protection (EF Core parameterized queries)
- CORS whitelist (localhost:5173 only)

## Database Connection

แก้ไขใน `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "AlmSqlServer": "Data Source=192.168.1.13\\ALUMETSERVERDB;Initial Catalog=ALMDB;User id=ntf_RW;Password=TheP@ssw0rd!;TrustServerCertificate=True;"
  }
}
```

## UI Design System

### Color Palette (ALUMET Brand)

**Primary - Orange**
- `#ff6600` - Main brand orange
- `#e55a00` - Dark orange (hover states)
- `#ff8533` - Light orange (accents)

**Secondary - Green**
- `#00a86b` - Success green
- `#008557` - Dark green (hover)
- `#00c17c` - Light green

**Usage:**
- Sidebar: Orange gradient background
- Primary buttons: Orange
- Success messages: Green
- Submit/Save buttons: Green
- Links & highlights: Orange

### Typography
- Headings: Bold, dark gray
- Body: Regular, medium gray
- Labels: Medium weight, dark gray

### Components Styling
- Rounded corners: `0.5rem`
- Shadows: Soft, subtle
- Borders: Light gray
- Focus rings: Orange (primary color)

## CORS Configuration

Backend อนุญาตเฉพาะ `http://localhost:5173` (Frontend dev server)

แก้ไขใน `Program.cs` ถ้าต้องการเปลี่ยน:
```csharp
options.AddPolicy("AllowFrontend", policy =>
{
    policy.WithOrigins("http://localhost:5173")
          .AllowAnyMethod()
          .AllowAnyHeader()
          .AllowCredentials();
});
```

## Phase 1.5: Dashboard & Analytics ✅ **[ทำเสร็จแล้ว]**

### Dashboard Page (`/dashboard`)

หน้าสำหรับผู้บริหารและ Auditor ติดตามความคืบหน้าการนับ Stock และตรวจสอบความถูกต้อง

**ฟีเจอร์หลัก:**

#### 1. ภาพรวมทั้งบริษัท (Company-Wide Overview)
**ส่วนบน - สถานะระดับรายการ:**
- **จำนวนรายการทั้งหมด**: Total items from Freeze Data
- **นับแล้ว**: จำนวนรายการที่มีการนับครบแล้ว
- **ความคืบหน้า %**: Progress bar แสดงสถานะ
- **สถานะ**: ยังไม่เริ่ม / กำลังดำเนินการ / เสร็จสมบูรณ์

**ส่วนล่าง - สถานะระดับคลังและ Location:**
- **📊 สถานะคลัง (Warehouse Summary)**:
  - คลังทั้งหมด
  - เริ่มนับแล้ว (countedItems > 0)
  - นับครบแล้ว (progress = 100%)
  - ยังไม่เริ่ม (countedItems = 0)
  
- **📍 สถานะ Locations (Location Summary)**:
  - Locations ทั้งหมด (รวมทุกคลัง)
  - นับแล้ว (locations ที่มีรายการนับ)
  - % ความคืบหน้า (locations นับแล้ว / locations ทั้งหมด)
  - ยังไม่นับ (locations ที่ยังไม่มีการนับ)

#### 2. ภาพรวมระดับคลัง (Warehouse Level)
แต่ละคลังแสดงเป็น Card พร้อม:
- **ความคืบหน้า %**: Progress bar สีตามระดับ (แดง→เหลือง→เขียว)
- **รายการทั้งหมด vs นับแล้ว**: ตัวเลขเปรียบเทียบ
- **Locations**: จำนวน location ที่นับแล้ว/ทั้งหมด
- **ยอดไม่ตรง**: จำนวนรายการที่มี Variance (เน้นสีแดง)
- **สถานะ**: ไม่มีข้อมูลตั้งต้น / ยังไม่เริ่ม / กำลังนับ / นับครบแล้ว
- **ปุ่มดูรายละเอียด**: Drill-down เข้าสู่ระดับ Location

#### 3. รายละเอียดคลัง - ระดับ Location (Drill-Down)
เมื่อคลิกที่คลัง จะแสดง:
- **สถานะแยกตาม Location**: 
  - Progress bar แต่ละ location
  - ทั้งหมด / นับแล้ว / ยอดไม่ตรง
  - สถานะการนับ
- **รายการที่มียอดไม่ตรง (Variance Details)**:
  - ตารางแสดง SKU, Batch, Freeze Qty, Count Qty
  - คำนวณผลต่าง และ % ส่วนต่าง
  - เรียงตามผลต่างมากสุด (สำหรับ Auditor)

#### 4. ข้อเสนอแนะสำหรับผู้บริหาร (Management Recommendations)
ระบบวิเคราะห์และแนะนำอัตโนมัติ:
- ความคืบหน้าต่ำกว่า 50% → แนะนำเร่งการดำเนินงาน
- พบคลังไม่มี Freeze Data → แนะนำนำเข้าข้อมูลก่อน
- พบรายการยอดไม่ตรง → แนะนำให้ Auditor ตรวจสอบ
- ความคืบหน้า ≥ 90% → แนะนำเตรียมรายงานสรุป

**การคำนวณ:**

```sql
-- ตัวอย่าง Query สำหรับเทียบ Freeze vs Count (ตาม requirement)
SELECT 
    f.sku, f.batchNo, f.qty as freezeQty, c.qty as countQty
FROM ntf_FreezeData f
LEFT JOIN ntf_Counting c ON f.whsId = c.whsId
    AND ISNULL(f.binId, 0) = ISNULL(c.binId, 0)
    AND f.sku = c.sku
    AND ISNULL(f.batchNo, '') = ISNULL(c.batchNo, '')
WHERE f.whsId = @whsId
```

**Business Logic:**
- **Matching Logic** (key สำคัญ):
  - whsId = whsId (ต้องตรงกัน)
  - ISNULL(binId, 0) = ISNULL(binId, 0) (จับคู่แม้ว่า NULL)
  - sku = sku (ต้องตรงกัน)
  - ISNULL(batchNo, '') = ISNULL(batchNo, '') (จับคู่แม้ว่า NULL)

- **% การนับ** = (จำนวนแถวที่มีการนับ / จำนวนแถว FreezeData) × 100
  - นับว่า "นับแล้ว" ถ้ามี record ใน ntf_Counting ที่ match ตาม logic ข้างบน
  - ไม่สนใจว่าจำนวนตรงกันหรือไม่

- **Variance Detection** = แสดงเฉพาะรายการที่ countQty ≠ freezeQty
  - แยกจาก % การนับ (ไม่เกี่ยว)
  - ใช้สำหรับ Auditor ตรวจสอบและแก้ไขตัวเลข
  - แสดง variance amount และ variance percentage

**API Endpoints:**

```
GET /api/dashboard/statistics
Response:
{
  "overall": {
    "totalFreezeItems": 1500,
    "totalCountedItems": 1200,
    "progressPercentage": 80.0,
    "status": "กำลังดำเนินการ"
  },
  "warehouses": [
    {
      "whsId": 1,
      "whsName": "WH_MILL",
      "totalItems": 800,
      "countedItems": 750,
      "varianceItems": 25,
      "progressPercentage": 93.75,
      "totalLocations": 20,
      "countedLocations": 19,
      "status": "กำลังนับ"
    }
  ]
}

GET /api/dashboard/warehouse/{whsId}
Response:
{
  "warehouse": { "whsId": 1, "whsName": "WH_MILL" },
  "locations": [
    {
      "binId": 1,
      "binLocation": "A1",
      "totalItems": 50,
      "countedItems": 48,
      "varianceItems": 3,
      "progressPercentage": 96.0,
      "status": "กำลังนับ"
    }
  ],
  "variances": [
    {
      "sku": "3012-001_AN_6063/T5_MILL",
      "batchNo": "E7-01-00001",
      "binLocation": "A1",
      "freezeQty": 100.00,
      "countQty": 95.50,
      "variance": 4.50,
      "variancePercentage": 4.50
    }
  ]
}
```

**UI/UX Highlights:**
- 🎨 **สีสัน ALUMET**: Orange (#ff6600) + Green (#00a86b)
- 📊 **Progress Bars**: สีเปลี่ยนตาม % (เทา→เหลือง→ส้ม→น้ำเงิน→เขียว)
- 🔍 **Drill-Down Navigation**: คลิก warehouse card → ดู location details
- ⚠️ **Variance Indicators**: ไอคอนแดงเตือนรายการที่ต้องตรวจสอบ
- 💡 **Smart Recommendations**: วิเคราะห์และแนะนำอัตโนมัติ
- 📱 **Responsive**: ปรับขนาดหน้าจอได้ (mobile/tablet/desktop)

**Implementation Notes:**
- Backend ใช้ LINQ queries แทน raw SQL เพื่อความ type-safe
- NtfFreezeData Model เพิ่ม BinId (nullable) เพื่อรองรับการ match กับ Counting
- Null handling: `(c.BinId == null && f.BinId == null || c.BinId == f.BinId)`
- Performance: Group by location แล้วค่อยนับ เพื่อลด database round trips

---

## การต่อยอดในอนาคต

### Phase 2: Advanced Reports & Export
- Export Excel with formatting
- Email notifications
- Schedule reports
- Historical trend analysis

### Phase 3: Mobile App
- Responsive design
- PWA support
- Offline mode
- Better barcode scanning (camera)

## Troubleshooting

### Backend ไม่ start
- เช็ค connection string
- เช็คว่า SQL Server รันอยู่หรือไม่
- ลอง `dotnet clean` แล้ว `dotnet build`

### Frontend ไม่ start
- ลบ `node_modules` แล้ว `npm install` ใหม่
- เช็ค port 5173 ว่าว่างหรือไม่
- เช็ค console errors

### Tailwind CSS ไม่ทำงาน
- Verify `@import "tailwindcss"` ใน `index.css`
- เช็ค `@tailwindcss/vite` plugin ใน `vite.config.ts`
- Restart dev server

### API Error 401 Unauthorized
- เช็คว่า login แล้วหรือยัง
- เช็ค token ใน localStorage
- เช็ค JWT configuration ใน `appsettings.json`

## สรุป

โปรเจคนี้เป็นระบบนับ Stock ครบวงจร ประกอบด้วย:

**✅ Phase 0 - Preparation (เสร็จสมบูรณ์)**
- Bin Mapping: บันทึก SKU/Batch ใน Location ต่างๆ
- Freeze Data: นำเข้าข้อมูลต้นฉบับก่อนเริ่มนับ
- Master Data: จัดการคลัง, Location, ผู้นับ, ผู้ใช้งาน

**✅ Phase 1 - Actual Counting (เสร็จสมบูรณ์)**
- Scan Count: นับ Stock จริงด้วย Scanner
- Real-time Updates: บันทึกและแสดงผลทันที
- Inline Editing: แก้ไขข้อมูลได้ทันที
- Audit Trail: ติดตามผู้แก้ไข และเวลาแก้ไข

**✅ Phase 1.5 - Dashboard & Analytics (เสร็จสมบูรณ์)**
- Executive Dashboard: ภาพรวมสำหรับผู้บริหาร
- Progress Tracking: ติดตามความคืบหน้าแบบ real-time
- Variance Detection: เตือนรายการที่ยอดไม่ตรง
- Drill-Down Navigation: Company → Warehouse → Location
- Smart Recommendations: วิเคราะห์และแนะนำอัตโนมัติ

**🎯 ระบบพร้อมใช้งานจริง - สำหรับกิจกรรมนับ Stock ประจำปี**

---
**Created:** November 20, 2025  
**Last Updated:** November 21, 2025  
**Version:** 1.5.0
