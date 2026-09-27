# 🚀 ระบบตรวจสอบสถานะเว็บล่ม CGD (Uptime Monitor & Email Alert)

ระบบตรวจสอบความพร้อมและสถานะออนไลน์ของเว็บไซต์ **`https://gcfa.cgd.go.th/login`** อัตโนมัติทุกๆ **120 วินาที** พร้อมระบบส่งอีเมลแจ้งเตือนวันและเวลาที่เว็บล่มไปยัง **`tripop.t.ba.project@gmail.com`** โดยพัฒนาด้วย Next.js และพร้อม Deploy บน [Vercel](https://vercel.com/) ได้ทันที

---

## 🌟 ฟีเจอร์หลักของระบบ (Features)

- 🌐 **ตรวจเช็คเว็บเป้าหมายอัตโนมัติ**: เช็ค `https://gcfa.cgd.go.th/login` ทุกๆ 120 วินาที (2 นาที)
- ⏰ **นับเวลาถอยหลัง (120s Countdown)**: แสดงเวลารอบถัดไปพร้อม Progress Bar บนหน้าเว็บ Dashboard
- 🚨 **แจ้งเตือนวันเวลาที่ล่มเข้า Email**: ส่งอีเมล HTML ดีไซน์สวยงาม พร้อมระบุวันเวลาตามเวลาประเทศไทย (พ.ศ. / น.) และรหัสข้อผิดพลาดไปยัง `tripop.t.ba.project@gmail.com`
- 🛡️ **ระบบป้องกันการสแปมอีเมล (Alert Throttling)**: แจ้งเตือนทันทีเมื่อตรวจพบล่มครั้งแรก และส่งแจ้งเตือนซ้ำทุก 30 นาทีหากยังคงล่มอยู่ พร้อมส่งอีเมลแจ้งเมื่อเว็บกลับมาใช้งานได้ปกติ (Recovery Alert)
- 🔊 **ระบบเสียงเตือน (Audio Alert)**: ส่งเสียงเตือนในแท็บเบราว์เซอร์เมื่อตรวจพบเว็บล่ม
- 📊 **ประวัติและสถิติ (Live History Log)**: บันทึกประวัติการเช็คย้อนหลัง 50 ครั้ง พร้อมความเร็ว Latency (ms) และสถานะ HTTP Code
- 🧪 **ปุ่มทดสอบส่งอีเมล (Test Email)**: กดทดสอบส่งอีเมลได้ทันทีจากหน้า Dashboard เพื่อยืนยันว่าอีเมลเข้ากล่องจดหมายจริง
- ☁️ **พร้อมสำหรับ Vercel & 24/7 Checking**: รองรับการยิง Endpoint `/api/check` ผ่าน Cron ภายนอก (เช่น cron-job.org) ให้ทำงานตลอด 24 ชั่วโมงแม้ปิดคอมพิวเตอร์

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── check/route.ts       # Endpoint ตรวจสอบสถานะเว็บ + ส่งเมลเมื่อล่ม
│   │   │   ├── status/route.ts      # Endpoint ดึงสถานะและประวัติ
│   │   │   └── test-email/route.ts  # Endpoint ทดสอบการส่งอีเมล
│   │   ├── globals.css              # สไตล์ Tailwind CSS
│   │   ├── layout.tsx               # Root Layout
│   │   └── page.tsx                 # Interactive Dashboard
│   ├── lib/
│   │   ├── email.ts                 # ระบบส่งอีเมล (Nodemailer) & เทมเพลตแจ้งเตือน
│   │   ├── monitor.ts               # ลอจิกการเชื่อมต่อ HTTP & คำนวณสถานะ
│   │   └── store.ts                 # จัดการประวัติและคูลดาวน์การส่งอีเมล
│   └── types/
│       └── index.ts                 # โครงสร้าง Type ข้อมูล
├── .env.example                     # ตัวอย่าง Environment Variables
├── vercel.json                      # การตั้งค่าสำหรับ Vercel
├── worker.js                        # สคริปต์ Background Worker เสริมสำหรับรัน Local / VPS
└── README.md
```

---

## 🛠️ วิธีการรันในเครื่อง (Local Setup)

1. ติดตั้ง Dependencies (หากยังไม่ได้ติดตั้ง):
   ```bash
   npm install
   ```

2. ตั้งค่าไฟล์ `.env.local`:
   คัดลอกไฟล์ `.env.example` เป็น `.env.local`
   ```env
   TARGET_URL=https://gcfa.cgd.go.th/login
   ALERT_TO_EMAIL=tripop.t.ba.project@gmail.com
   CHECK_INTERVAL_SECONDS=120

   # ตั้งค่าอีเมลผู้ส่ง (แนะนำใช้ Gmail App Password)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_16_char_app_password
   SMTP_FROM_NAME="CGD Web Monitor Alert"

   # Secret Key ป้องกันการเรียก API
   CRON_SECRET=cgd_monitor_secret_key_2026
   ```

3. รันโปรเจกต์:
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

---

## 📧 วิธีสร้าง Gmail App Password (รหัสผ่าน 16 หลัก)

สำหรับการส่งอีเมลผ่าน Gmail โดยไม่ถูกบล็อก:
1. เข้าไปที่ [Google Account Security](https://myaccount.google.com/security)
2. ตรวจสอบให้แน่ใจว่าได้เปิด **2-Step Verification (การยืนยันแบบ 2 ขั้นตอน)** แล้ว
3. ค้นหาคำว่า **"App passwords"** หรือเข้าลิงก์ [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. ตั้งชื่อแอป เช่น `Uptime Monitor` แล้วกด **Create**
5. นำรหัส 16 ตัวอักษรที่ได้ มาใส่ในช่อง `SMTP_PASS`

---

## 🚀 วิธี Deploy บน Vercel (ขั้นตอนโดยละเอียด)

### วิธีที่ 1: Deploy ผ่าน Vercel CLI (ง่ายและเร็วที่สุด)
1. เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่ง:
   ```bash
   npx vercel
   ```
2. ทำตามขั้นตอนบนหน้าจอ (เข้าสู่ระบบ Vercel และยืนยันการ Deploy)
3. รันคำสั่งสำหรับขึ้น Production:
   ```bash
   npx vercel --prod
   ```

### วิธีที่ 2: Deploy ผ่าน GitHub & Vercel Dashboard
1. สร้าง Git Repository และ Push โค้ดขึ้น GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: initial cgd uptime monitor"
   git branch -M main
   # นำไป push บน github repository ของคุณ
   ```
2. เข้าไปที่ [vercel.com](https://vercel.com/) แล้วกด **Add New Project**
3. เลือก Repository ที่เพิ่ง Push ขึ้นไป

### ⚙️ การตั้งค่า Environment Variables บน Vercel
เข้าไปที่หน้าโปรเจกต์ใน Vercel > **Settings** > **Environment Variables** แล้วเพิ่มตัวแปรต่อไปนี้:
| Variable Name | Example Value | คำอธิบาย |
|---------------|---------------|---------|
| `TARGET_URL` | `https://gcfa.cgd.go.th/login` | เว็บไซต์เป้าหมาย |
| `ALERT_TO_EMAIL` | `tripop.t.ba.project@gmail.com` | อีเมลที่ต้องการรับแจ้งเตือน |
| `CHECK_INTERVAL_SECONDS` | `120` | รอบการตรวจ (วินาที) |
| `SMTP_HOST` | `smtp.gmail.com` | โฮสต์เซิร์ฟเวอร์ SMTP |
| `SMTP_PORT` | `465` | พอร์ต SMTP |
| `SMTP_SECURE` | `true` | ใช้การเข้ารหัส SSL/TLS |
| `SMTP_USER` | `your_sender_email@gmail.com` | อีเมลที่ใช้เป็นผู้ส่ง |
| `SMTP_PASS` | `xxxx xxxx xxxx xxxx` | App Password 16 หลัก |
| `CRON_SECRET` | `cgd_monitor_secret_key_2026` | รหัสป้องกันการยิง API |

---

## ⏰ วิธีตั้งค่าให้เช็ค 24 ชั่วโมงทุกๆ 120 วินาทีฟรี (24/7 Background Cron)

เนื่องจาก Vercel เป็น Serverless Platform เมื่อไม่มีคนเปิดหน้าเว็บ เซิร์ฟเวอร์จะหลับ (Sleep) หากต้องการให้ระบบตรวจเช็คตลอด 24 ชม. ทุก 120 วินาที แม้ปิดคอมพิวเตอร์:

1. สมัครใช้งานฟรีที่ [cron-job.org](https://cron-job.org/)
2. กดปุ่ม **"Create Cronjob"**
3. กรอกรายละเอียดดังนี้:
   - **Title**: `CGD Uptime Check (Every 2 mins)`
   - **URL**: `https://<your-vercel-domain>.vercel.app/api/check?cron=true&key=cgd_monitor_secret_key_2026`
   - **Execution Schedule**: เลือก **Every 2 minutes (ทุก 2 นาที)**
   - **Request Method**: `GET`
4. กด **Save**
5. ตอนนี้ระบบจะยิงตรวจเช็ค `https://gcfa.cgd.go.th/login` ให้คุณทุกๆ 120 วินาทีอัตโนมัติตลอด 24/7 และหากเว็บล่ม ระบบจะส่งอีเมลแจ้งเตือนวันและเวลาไปยัง `tripop.t.ba.project@gmail.com` ทันที!
