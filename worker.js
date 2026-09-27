/**
 * Standalone Worker Script (Optional)
 * รันสคริปต์นี้เพื่อตรวจสอบเว็บทุกๆ 120 วินาทีแบบ Background process:
 * คำสั่ง: node worker.js
 */

const TARGET_URL = process.env.TARGET_URL || 'https://gcfa.cgd.go.th/login';
const ALERT_EMAIL = process.env.ALERT_TO_EMAIL || 'tripop.t.ba.project@gmail.com';
const INTERVAL_SECONDS = Number(process.env.CHECK_INTERVAL_SECONDS) || 120;

console.log('='.repeat(60));
console.log('🚀 CGD Website Uptime Monitor Worker Started');
console.log(`🌐 เป้าหมาย: ${TARGET_URL}`);
console.log(`📧 ส่งแจ้งเตือนเมื่อล่ม: ${ALERT_EMAIL}`);
console.log(`⏱️ ความถี่: ตรวจสอบทุกๆ ${INTERVAL_SECONDS} วินาที (120s)`);
console.log('='.repeat(60));

async function runCheck() {
  const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
  const start = Date.now();
  try {
    const res = await fetch(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
    const latency = Date.now() - start;
    if (res.ok) {
      console.log(`[${timestamp}] ✅ ONLINE | HTTP ${res.status} | Latency: ${latency}ms`);
    } else {
      console.error(`[${timestamp}] ❌ DOWN | HTTP ${res.status} ${res.statusText} | Latency: ${latency}ms`);
    }
  } catch (err) {
    const latency = Date.now() - start;
    console.error(`[${timestamp}] ❌ DOWN (Connection Error) | ${err.message} | Latency: ${latency}ms`);
  }
}

// Check immediately on startup
runCheck();

// Loop every 120 seconds
setInterval(runCheck, INTERVAL_SECONDS * 1000);
