/**
 * Standalone Worker Script for Background Monitoring (from Thailand)
 * รันระบบตรวจจับเว็บล่มในพื้นหลังแบบ 100% ไม่ต้องเปิดเบราว์เซอร์
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// 1. อ่านค่าจาก .env.local อัตโนมัติ
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const TARGET_URL = process.env.TARGET_URL || 'https://gcfa.cgd.go.th/login';
const ALERT_EMAIL = process.env.ALERT_TO_EMAIL || 'tripop.t.ba.project@gmail.com';
const INTERVAL_SECONDS = Number(process.env.CHECK_INTERVAL_SECONDS) || 120;

// State management
let previousStatus = 'UNKNOWN';
let lastAlertSentAt = 0;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 นาทีแจ้งซ้ำ

console.log('='.repeat(65));
console.log('🚀 CGD Website Uptime Monitor Worker (Background Engine)');
console.log(`🌐 ตรวจสอบ: ${TARGET_URL}`);
console.log(`⏱️ ความถี่: ทุกๆ ${INTERVAL_SECONDS} วินาที (2 นาที)`);
console.log(`📧 ส่งอีเมลแจ้งเตือนไปที่: ${ALERT_EMAIL}`);
console.log('='.repeat(65));

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });
}

function getThaiDateTime() {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date()) + ' น.';
}

async function sendEmailAlert(isDown, details) {
  const transporter = createTransporter();
  const thaiTime = getThaiDateTime();
  const subject = isDown
    ? `🚨 [แจ้งเตือนด่วน] เว็บไซต์ล่ม: ${TARGET_URL} (${thaiTime})`
    : `✅ [กลับมาใช้งานได้แล้ว] เว็บไซต์ออนไลน์ปกติ: ${TARGET_URL} (${thaiTime})`;

  const html = isDown
    ? `
    <div style="font-family: sans-serif; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; color: #991b1b;">
      <h2 style="margin-top:0;">🚨 แจ้งเตือนเว็บไซต์เกิดเหตุขัดข้อง (DOWN)</h2>
      <p>ระบบตรวจพบว่าเว็บไซต์ไม่สามารถเข้าใช้งานได้ตามปกติ</p>
      <ul>
        <li><strong>เว็บไซต์:</strong> <a href="${TARGET_URL}">${TARGET_URL}</a></li>
        <li><strong>วันและเวลาที่ล่ม:</strong> <span style="color:#dc2626;">${thaiTime}</span></li>
        <li><strong>รายละเอียด:</strong> <code>${details}</code></li>
        <li><strong>ความถี่ในการตรวจ:</strong> ทุกๆ ${INTERVAL_SECONDS} วินาที</li>
      </ul>
      <p style="font-size: 12px; color: #6b7280;">ส่งโดย CGD Uptime Monitor Background Service</p>
    </div>`
    : `
    <div style="font-family: sans-serif; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; color: #166534;">
      <h2 style="margin-top:0;">✅ เว็บไซต์กลับมาใช้งานได้ตามปกติแล้ว (RECOVERED)</h2>
      <p>ระบบสามารถเชื่อมต่อกับเว็บไซต์ได้ตามปกติแล้ว</p>
      <ul>
        <li><strong>เว็บไซต์:</strong> <a href="${TARGET_URL}">${TARGET_URL}</a></li>
        <li><strong>เวลาที่กู้คืน:</strong> ${thaiTime}</li>
        <li><strong>รายละเอียด:</strong> ${details}</li>
      </ul>
      <p style="font-size: 12px; color: #6b7280;">ส่งโดย CGD Uptime Monitor Background Service</p>
    </div>`;

  try {
    const info = await transporter.sendMail({
      from: `"CGD Web Monitor Alert" <${process.env.SMTP_USER}>`,
      to: ALERT_EMAIL,
      subject,
      html,
    });
    console.log(`[${thaiTime}] 📧 ส่งอีเมลแจ้งเตือนสำเร็จ: ${info.messageId}`);
  } catch (err) {
    console.error(`[${thaiTime}] ⚠️ ส่งอีเมลไม่สำเร็จ:`, err.message);
  }
}

async function runCheck() {
  const thaiTime = getThaiDateTime();
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(TARGET_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (res.ok) {
      console.log(`[${thaiTime}] 🟢 ONLINE | HTTP ${res.status} | Latency: ${latency}ms`);
      if (previousStatus === 'DOWN') {
        await sendEmailAlert(false, `HTTP ${res.status} OK (${latency}ms)`);
      }
      previousStatus = 'UP';
    } else {
      console.error(`[${thaiTime}] 🔴 DOWN | HTTP ${res.status} | Latency: ${latency}ms`);
      handleDown(`HTTP ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    const latency = Date.now() - start;
    console.error(`[${thaiTime}] 🔴 DOWN (Connection Error) | ${err.message} | Latency: ${latency}ms`);
    handleDown(err.message);
  }
}

async function handleDown(errorDetails) {
  const now = Date.now();
  if (previousStatus !== 'DOWN' || now - lastAlertSentAt >= COOLDOWN_MS) {
    previousStatus = 'DOWN';
    lastAlertSentAt = now;
    await sendEmailAlert(true, errorDetails);
  }
}

// Initial check
runCheck();

// Loop every 120s
setInterval(runCheck, INTERVAL_SECONDS * 1000);
