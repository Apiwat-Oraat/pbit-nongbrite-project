# การติดตั้งและรันโปรเจค

## ⚡ Quick Start

### 1. ความต้องการของระบบ
ติดตั้งให้ครบก่อนเริ่มใช้งาน:
- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/) (มักจะมาพร้อมกับ Docker Desktop)
- [Git](https://git-scm.com/downloads)

### 2. Clone โปรเจค
```bash
git clone <repository-url>
cd project-name
```

### 3. รันโปรเจค
```bash
# Build และ start ทุก services
docker-compose up --build

# หรือรันใน background (ไม่ต้องดู logs)
docker-compose up -d --build
```

### 4. เข้าใช้งาน
เมื่อทุก services เริ่มทำงานแล้ว:

- **🌐 Frontend**: http://localhost:3000
- **🚀 Backend**: http://localhost:4000  
- **🗄️ Database**: localhost:5432

---

## 📋 คำสั่งที่มีประโยชน์

### ดู logs
```bash
# ดู logs ทุก services
docker-compose logs -f

# ดู logs เฉพาะ service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### หยุดและเริ่มใหม่
```bash
# หยุด services
docker-compose down

# เริ่มใหม่
docker-compose up

# restart service เดียว
docker-compose restart backend
```

### ลบข้อมูลและเริ่มใหม่
```bash
# ลบทุกอย่าง (รวม database)
docker-compose down -v

# สร้างใหม่หมด
docker-compose up --build
```

---

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

**Port ชน:**
```bash
Error: Port 3000 is already in use
```
**แก้ไข:** หยุดโปรแกรมที่ใช้ port นั้นก่อน หรือเปลี่ยน port ใน `docker-compose.yml`

**Database connection failed:**
```bash
Error: Connection refused
```
**แก้ไข:** รอให้ database start เสร็จก่อน (ประมาณ 30-60 วินาที)

**Out of disk space:**
```bash
# ลบ images และ containers เก่า
docker system prune -a
```

### ตรวจสอบสถานะ
```bash
# ดู services ที่กำลังทำงาน
docker-compose ps

# ตรวจสอบ health ของ database
docker-compose exec db pg_isready -U admin -d mydb
```

---

## 🛠️ Development

### การแก้ไขโค้ด
- ไฟล์ที่แก้ไขจะ sync กับ container อัตโนมัติ
- ไม่ต้อง restart services เมื่อแก้ไขโค้ด

### การติดตั้ง package ใหม่
```bash
# เข้าไปใน container
docker-compose exec backend bash
npm install <package-name>
exit

# rebuild container
docker-compose up --build backend
```

### การรัน database migration
```bash
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma generate
```

---

## 📁 โครงสร้างโปรเจค

```
project/
├── backend/                 # Node.js Backend
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── Dockerfile
├── frontend/                # Next.js Frontend  
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml       # Docker configuration
```

---

## 💡 Tips

- **Development**: ใช้ `docker-compose up` เพื่อดู logs
- **Production**: ใช้ `docker-compose up -d` เพื่อรันใน background  
- **Debug**: ใช้ `docker-compose logs -f <service-name>` เพื่อดู logs service เฉพาะ
- **Reset**: หากมีปัญหา ลอง `docker-compose down -v && docker-compose up --build`

---

## 📞 ติดต่อ

หากมีปัญหาในการติดตั้ง สามารถติดต่อได้ที่:
- GitHub Issues: [Link]
- Email: [Email]