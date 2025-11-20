# Stock Counting System - Project Documentation

## ภาพรวมโปรเจค

ระบบนับ Stock สิ้นปี (Phase 0: เตรียมการ) สำหรับการบันทึก SKU และ Batch Number ลงใน Bin Location ก่อนการนับ Stock จริง

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
- **React Router v6** - Routing
- **Redux Toolkit** - State Management
- **Axios** - HTTP Client

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

## โครงสร้างโปรเจค Backend

```
StockCountBack/
├── Data/
│   └── StockCountDbContext.cs          # EF Core DbContext
├── Models/
│   ├── NtfUser.cs                      # User Entity
│   ├── NtfWhsGroup.cs                  # Warehouse Entity
│   ├── NtfLocation.cs                  # Location Entity
│   └── NtfBinMapping.cs                # BinMapping Entity
├── DTOs/
│   └── ApiDtos.cs                      # Data Transfer Objects
├── Services/
│   ├── AuthService.cs                  # Authentication & Password Service
│   └── DatabaseSeeder.cs               # Database Seeding
├── Endpoints/
│   ├── AuthEndpoints.cs                # /api/auth/*
│   ├── WarehouseEndpoints.cs           # /api/warehouses/*
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
│   │       └── ...
│   ├── pages/
│   │   ├── LoginPage.tsx               # หน้า Login
│   │   ├── DashboardPage.tsx           # หน้า Dashboard (TODO)
│   │   ├── ScanBinMappingPage.tsx      # หน้าสแกน Bin Mapping (หลัก)
│   │   ├── WarehouseManagementPage.tsx # จัดการคลัง (Admin)
│   │   ├── LocationManagementPage.tsx  # จัดการ Location (Admin)
│   │   ├── BinMappingManagementPage.tsx # ดู/ลบ Mapping (Admin)
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

✅ Backend
- Authentication System (Login/Register/JWT)
- Password Hashing (BCrypt)
- CRUD APIs สำหรับ Warehouse, Location, BinMapping, User
- Scan Label Endpoint พร้อม parser |SKU|batchNo|
- Duplicate checking
- Role-based Authorization (admin/staff)
- Database Seeding (admin user)
- Removed deprecated WithOpenApi() methods

✅ Frontend
- Login Page
- Protected Routes
- Dashboard Layout with Sidebar
- Redux State Management
- Axios API Client
- **Scan Bin Mapping Page** (หน้าหลักสำหรับ Phase 0)
  - Auto-focus & clear pattern
  - Validation & immediate feedback
  - Error handling with recovery
- **Master Data Pages** (Admin only):
  - ✅ Warehouse Management (CRUD)
  - ✅ Bin Location Management (CRUD with filter)
  - ✅ Bin Mapping Management (View/Delete with filters)
- **Admin Pages**:
  - ✅ User Management (CRUD + Reset Password)

## ฟีเจอร์ที่ยังไม่ทำ (TODO)

Frontend Pages ที่ยังไม่ได้สร้าง:
- [ ] Dashboard Page (แสดงสถิติ)
- [ ] Scan Count Page (Phase 1)

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

- Password เข้ารหัสด้วย BCrypt (cost factor 12)
- JWT Token Authentication
- HTTP-only Cookies (จาก Frontend config)
- Authorization middleware (admin/staff roles)
- Protected endpoints
- Input validation
- SQL Injection protection (EF Core parameterized queries)

## Database Connection

แก้ไขใน `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "AlmSqlServer": "Data Source=192.168.1.13\\ALUMETSERVERDB;Initial Catalog=ALMDB;User id=ntf_RW;Password=TheP@ssw0rd!;TrustServerCertificate=True;"
  }
}
```

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

## การต่อยอดในอนาคต

### Phase 1: Scan Count (นับ Stock จริง)
- สร้าง Count Sheet
- Scan และนับจำนวน
- เปรียบเทียบกับ Stock ในระบบ
- รายงาน Variance

### Phase 2: Reports
- รายงานสรุป Bin Mapping
- รายงาน Count Sheet
- Export Excel
- Dashboard Analytics

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

โปรเจคนี้เป็น **Phase 0** ของระบบนับ Stock ที่เน้นการเตรียมการ โดยบันทึกว่า SKU และ Batch Number อยู่ใน Location ไหน เพื่อเตรียมพร้อมสำหรับการนับ Stock จริงใน Phase ถัดไป

Backend มีความสมบูรณ์แล้ว Frontend มีโครงสร้างและหน้าหลัก (Scan Bin Mapping) สร้างเสร็จแล้ว ส่วนหน้าอื่นๆ สามารถทำต่อได้ตามโครงสร้างที่วางไว้

---
**Created:** November 20, 2025  
**Version:** 1.0.0
