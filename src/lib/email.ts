import nodemailer from 'nodemailer';
import { CheckResult } from '@/types';

export const DEFAULT_ALERT_EMAIL = 'tripop.t.ba.project@gmail.com';
export const DEFAULT_TARGET_URL = 'https://gcfa.cgd.go.th/login';

export function formatThaiDateTime(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date) + ' น.';
}

export function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export async function sendDowntimeAlert(
  result: CheckResult,
  recipientEmail: string = process.env.ALERT_TO_EMAIL || DEFAULT_ALERT_EMAIL
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    const errorMsg =
      'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in environment variables.';
    console.warn(`[Email Alert] Skipped sending email: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const senderName = process.env.SMTP_FROM_NAME || 'CGD Uptime Monitor Alert';
  const senderEmail = process.env.SMTP_USER;
  const targetUrl = result.url || DEFAULT_TARGET_URL;
  const downTimeThai = result.thaiTime || formatThaiDateTime(new Date(result.timestamp));
  const downTimeIso = result.timestamp;
  const errorDetails = result.error || (result.statusCode ? `HTTP Status ${result.statusCode} (${result.statusText})` : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Connection Timeout/Refused)');

  const subject = `🚨 [แจ้งเตือนด่วน] เว็บไซต์ล่ม: ${targetUrl} (${downTimeThai})`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>แจ้งเตือนเว็บไซต์ล่ม</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 28px 24px; }
    .alert-card { background-color: #fef2f2; border: 1px solid #fecaca; border-left: 5px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
    .alert-card h2 { margin: 0 0 8px 0; color: #991b1b; font-size: 16px; font-weight: 600; }
    .alert-card p { margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .info-table th { text-align: left; padding: 10px 12px; background-color: #f9fafb; color: #4b5563; font-size: 13px; border-bottom: 1px solid #e5e7eb; width: 35%; }
    .info-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; }
    .badge-down { display: inline-block; background-color: #fee2e2; color: #991b1b; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; }
    .btn { display: inline-block; background-color: #1f2937; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center; }
    .footer { background-color: #f9fafb; padding: 18px 24px; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 แจ้งเตือนเว็บไซต์เกิดเหตุขัดข้อง (DOWN)</h1>
      <p>ระบบตรวจพบว่าเว็บไซต์เป้าหมายไม่ตอบสนอง</p>
    </div>
    <div class="content">
      <div class="alert-card">
        <h2>สถานะ: ล่ม / ไม่สามารถเข้าใช้งานได้</h2>
        <p>ระบบตรวจสอบความพร้อมของเว็บไซต์พบว่าเซิร์ฟเวอร์ปลายทางไม่สามารถตอบสนองคำขอได้ตามปกติ</p>
      </div>

      <table class="info-table">
        <tr>
          <th>🌐 เว็บไซต์ที่ตรวจ</th>
          <td><strong><a href="${targetUrl}" target="_blank" style="color:#2563eb; text-decoration:none;">${targetUrl}</a></strong></td>
        </tr>
        <tr>
          <th>⏰ วันที่และเวลาที่ล่ม</th>
          <td><strong style="color: #dc2626;">${downTimeThai}</strong><br><small style="color: #6b7280;">(ISO: ${downTimeIso})</small></td>
        </tr>
        <tr>
          <th>🔍 สถานะการตอบกลับ</th>
          <td><span class="badge-down">${result.status} ${result.statusCode ? `(Code ${result.statusCode})` : ''}</span></td>
        </tr>
        <tr>
          <th>⚠️ รายละเอียดปัญหา</th>
          <td><code>${errorDetails}</code></td>
        </tr>
        <tr>
          <th>⏱️ ความถี่การเช็ค</th>
          <td>ตรวจสอบซ้ำทุกๆ 120 วินาที (2 นาที)</td>
        </tr>
        <tr>
          <th>📧 ผู้รับการแจ้งเตือน</th>
          <td>${recipientEmail}</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${targetUrl}" class="btn" target="_blank">เปิดหน้าเว็บเพื่อตรวจสอบ</a>
      </div>
    </div>
    <div class="footer">
      ส่งโดยระบบ CGD Website Uptime Monitor • Deploy บน Vercel<br>
      ระบบจะตรวจสอบทุกๆ 120 วินาที และจะแจ้งเตือนเพิ่มเติมหากสถานะยังคงขัดข้อง
    </div>
  </div>
</body>
</html>
  `;

  const text = `
[แจ้งเตือนด่วน] เว็บไซต์ล่ม: ${targetUrl}
==================================================
สถานะ: ล่ม (DOWN)
เว็บไซต์: ${targetUrl}
วันที่และเวลาที่ล่ม: ${downTimeThai} (${downTimeIso})
รายละเอียดปัญหา: ${errorDetails}
การตรวจสอบ: ตรวจสอบซ้ำทุก 120 วินาที
ผู้รับการแจ้งเตือน: ${recipientEmail}
==================================================
ส่งโดยระบบ CGD Website Uptime Monitor
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipientEmail,
      subject,
      text,
      html,
    });
    console.log(`[Email Alert] Successfully sent downtime alert to ${recipientEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Email Alert] Failed to send email: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

export async function sendRecoveryAlert(
  result: CheckResult,
  recipientEmail: string = process.env.ALERT_TO_EMAIL || DEFAULT_ALERT_EMAIL
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    return { success: false, error: 'SMTP credentials not configured.' };
  }

  const senderName = process.env.SMTP_FROM_NAME || 'CGD Uptime Monitor Alert';
  const senderEmail = process.env.SMTP_USER;
  const targetUrl = result.url || DEFAULT_TARGET_URL;
  const recoveredTimeThai = result.thaiTime || formatThaiDateTime(new Date(result.timestamp));

  const subject = `✅ [กลับมาใช้งานได้แล้ว] เว็บไซต์ทำงานปกติ: ${targetUrl} (${recoveredTimeThai})`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>เว็บไซต์กลับมาใช้งานได้ตามปกติแล้ว</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 24px; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .content { padding: 28px 24px; }
    .badge-up { display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 9999px; }
    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .info-table th { text-align: left; padding: 10px 12px; background-color: #f9fafb; color: #4b5563; font-size: 13px; border-bottom: 1px solid #e5e7eb; width: 35%; }
    .info-table td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; }
    .btn { display: inline-block; background-color: #15803d; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px; text-align: center; }
    .footer { background-color: #f9fafb; padding: 18px 24px; font-size: 12px; color: #6b7280; text-align: center; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ เว็บไซต์กลับมาออนไลน์ปกติ (RECOVERED)</h1>
      <p>ระบบตรวจพบว่าเว็บไซต์สามารถเข้าถึงได้ตามปกติแล้ว</p>
    </div>
    <div class="content">
      <table class="info-table">
        <tr>
          <th>🌐 เว็บไซต์</th>
          <td><strong><a href="${targetUrl}" target="_blank" style="color:#2563eb; text-decoration:none;">${targetUrl}</a></strong></td>
        </tr>
        <tr>
          <th>⏰ เวลาที่กู้คืนสำเร็จ</th>
          <td><strong style="color: #16a34a;">${recoveredTimeThai}</strong></td>
        </tr>
        <tr>
          <th>🔍 สถานะล่าสุด</th>
          <td><span class="badge-up">HTTP 200 OK (${result.latencyMs} ms)</span></td>
        </tr>
      </table>
      <div style="text-align: center;">
        <a href="${targetUrl}" class="btn" target="_blank">เปิดดูหน้าเว็บไซต์</a>
      </div>
    </div>
    <div class="footer">
      ส่งโดยระบบ CGD Website Uptime Monitor • Deploy บน Vercel
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipientEmail,
      subject,
      text: `[แจ้งเตือน] เว็บไซต์ ${targetUrl} กลับมาใช้งานได้ตามปกติแล้วเมื่อ ${recoveredTimeThai}`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}

export async function sendTestEmail(
  recipientEmail: string = process.env.ALERT_TO_EMAIL || DEFAULT_ALERT_EMAIL
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      success: false,
      error: 'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in environment variables or .env.local file.',
    };
  }

  const senderName = process.env.SMTP_FROM_NAME || 'CGD Uptime Monitor Test';
  const senderEmail = process.env.SMTP_USER;
  const thaiNow = formatThaiDateTime(new Date());

  const subject = `🧪 [ทดสอบการส่งอีเมล] ระบบตรวจสอบเว็บล่ม CGD (${thaiNow})`;

  const html = `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"><title>ทดสอบอีเมล</title></head>
<body style="font-family: sans-serif; background-color: #f3f4f6; padding: 24px;">
  <div style="max-width: 550px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <h2 style="color: #2563eb; margin-top: 0;">🧪 ยืนยันการเชื่อมต่อระบบอีเมลสำเร็จ!</h2>
    <p>อีเมลนี้เป็นการทดสอบจากระบบ <strong>CGD Website Uptime Monitor</strong></p>
    <p>ระบบพร้อมที่จะส่งอีเมลแจ้งเตือนไปยัง <strong>${recipientEmail}</strong> ทันทีหากตรวจพบว่า <code>https://gcfa.cgd.go.th/login</code> ล่ม</p>
    <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="font-size: 12px; color: #6b7280;">วันและเวลาทดสอบ: ${thaiNow}</p>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: recipientEmail,
      subject,
      text: `ทดสอบระบบส่งอีเมลสำเร็จ! ส่งไปยัง ${recipientEmail} เมื่อ ${thaiNow}`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMsg };
  }
}
