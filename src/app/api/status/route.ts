import { NextResponse } from 'next/server';
import { getMonitorState, resetMonitorHistory } from '@/lib/store';
import { DEFAULT_ALERT_EMAIL, DEFAULT_TARGET_URL } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const state = getMonitorState();
  const targetUrl = process.env.TARGET_URL || DEFAULT_TARGET_URL;
  const alertEmail = process.env.ALERT_TO_EMAIL || DEFAULT_ALERT_EMAIL;
  const intervalSeconds = Number(process.env.CHECK_INTERVAL_SECONDS) || 120;
  const hasSmtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

  return NextResponse.json({
    config: {
      targetUrl,
      alertEmail,
      intervalSeconds,
      hasSmtpConfigured,
    },
    state,
  });
}

export async function DELETE() {
  resetMonitorHistory();
  return NextResponse.json({ success: true, message: 'History cleared' });
}
