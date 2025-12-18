# Docker Deployment Guide

คู่มือการใช้งาน Docker สำหรับโปรเจค Stock Counting System

## 📋 ข้อกำหนดเบื้องต้น

- Docker Desktop (Windows/Mac) หรือ Docker Engine (Linux)
- Docker Compose v2.0 ขึ้นไป
- SQL Server (หรือใช้ SQL Server Docker image)

## 🚀 การ Deploy แบบรวดเร็ว

### 1. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` จาก `.env.example`:

```bash
cp .env.example .env
```

แก้ไขค่าต่างๆ ในไฟล์ `.env` ให้ตรงกับสภาพแวดล้อมของคุณ:

```env
# Database Connection
DB_SERVER=your-actual-server
DB_NAME=StockCountDB
DB_USER=your-username
DB_PASSWORD=your-secure-password

# JWT Secret (สร้าง random string ที่มีความปลอดภัย)
JWT_SECRET_KEY=your-very-long-and-secure-secret-key-minimum-32-chars
```

### 2. Build และ Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# ดู logs
docker-compose logs -f
```

### 3. เข้าใช้งาน

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔧 คำสั่งที่ใช้บ่อย

```bash
# ดู status ของ containers
docker-compose ps

# หยุดการทำงาน
docker-compose stop

# เริ่มใหม่
docker-compose restart

# ลบ containers
docker-compose down

# ลบ containers และ volumes
docker-compose down -v

# Build ใหม่ทั้งหมด
docker-compose build --no-cache

# ดู logs ของ service ใดๆ
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 📦 Deploy ไปเครื่องอื่น

### วิธีที่ 1: ใช้ Docker Images

```bash
# 1. Build images
docker-compose build

# 2. Save images เป็นไฟล์
docker save -o stockcount-backend.tar stockcount-backend
docker save -o stockcount-frontend.tar stockcount-frontend

# 3. Copy ไฟล์ไปเครื่องปลายทาง
# - stockcount-backend.tar
# - stockcount-frontend.tar
# - docker-compose.yml
# - .env

# 4. บนเครื่องปลายทาง: Load images
docker load -i stockcount-backend.tar
docker load -i stockcount-frontend.tar

# 5. Run
docker-compose up -d
```

### วิธีที่ 2: ใช้ Docker Registry

```bash
# 1. Tag images
docker tag stockcount-backend your-registry/stockcount-backend:latest
docker tag stockcount-frontend your-registry/stockcount-frontend:latest

# 2. Push to registry
docker push your-registry/stockcount-backend:latest
docker push your-registry/stockcount-frontend:latest

# 3. บนเครื่องปลายทาง: Pull และ Run
docker-compose pull
docker-compose up -d
```

### วิธีที่ 3: Copy โค้ดไปและ Build บนเครื่องปลายทาง

```bash
# Copy โฟลเดอร์ทั้งหมดไปเครื่องปลายทาง
# แล้ว build และ run
docker-compose build
docker-compose up -d
```

## 🌐 Production Deployment

สำหรับ Production ใช้ไฟล์ `docker-compose.prod.yml`:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### ใช้กับ Reverse Proxy (Nginx/Traefik)

แนะนำให้ใช้ reverse proxy สำหรับ production:

```nginx
# Nginx example
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 Security Best Practices

1. **JWT Secret Key**: สร้าง random key ที่ปลอดภัย
   ```bash
   # Generate secure key
   openssl rand -base64 64
   ```

2. **Database Password**: ใช้รหัสผ่านที่ซับซ้อน

3. **Environment Variables**: ไม่ควร commit ไฟล์ `.env` ลง Git

4. **HTTPS**: ใช้ SSL/TLS certificate ใน production

5. **Firewall**: เปิดเฉพาะ ports ที่จำเป็น

## 🗄️ Database Setup

### ใช้ SQL Server ภายนอก

แก้ไข connection string ใน `.env`:

```env
DB_SERVER=your-sql-server.database.windows.net
DB_NAME=StockCountDB
DB_USER=your-admin
DB_PASSWORD=your-password
```

### ใช้ SQL Server ใน Docker

Uncomment ส่วน `database` service ใน `docker-compose.yml`:

```yaml
database:
  image: mcr.microsoft.com/mssql/server:2022-latest
  # ... (ดูใน docker-compose.yml)
```

## 🐛 Troubleshooting

### Backend ไม่สามารถเชื่อมต่อ Database

```bash
# ตรวจสอบ connection string
docker-compose exec backend env | grep ConnectionStrings

# ทดสอบเชื่อมต่อ database
docker-compose exec backend dotnet ef database list
```

### Frontend ไม่เห็น Backend

ตรวจสอบ API URL ใน frontend configuration:

```typescript
// src/api/client.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

### Port Conflict

ถ้า port 3000 หรือ 5000 ถูกใช้งานแล้ว แก้ไขใน `docker-compose.yml`:

```yaml
ports:
  - "8080:8080"  # แทน 5000:8080
```

## 📊 Monitoring

### ดู Resource Usage

```bash
docker stats
```

### Health Checks

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost:3000
```

## 🔄 Updates และ Maintenance

```bash
# Update และ restart
docker-compose pull
docker-compose up -d

# Backup database (ถ้าใช้ Docker database)
docker-compose exec database /opt/mssql-tools/bin/sqlcmd \
  -S localhost -U SA -P 'YourPassword' \
  -Q "BACKUP DATABASE [StockCountDB] TO DISK = N'/var/opt/mssql/backup/StockCountDB.bak'"
```

## 📝 Notes

- Backend รันที่ port 5000 (internal: 8080)
- Frontend รันที่ port 3000 (internal: 80)
- ปรับ environment variables ตามความเหมาะสม
- สำหรับ production ควรใช้ secrets management
- ควรตั้งค่า backup และ monitoring
