import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    has_SMTP_USER: Boolean(process.env.SMTP_USER),
    has_SMTP_PASS: Boolean(process.env.SMTP_PASS),
    has_TARGET_URL: Boolean(process.env.TARGET_URL),
    has_ALERT_TO_EMAIL: Boolean(process.env.ALERT_TO_EMAIL),
    has_CRON_SECRET: Boolean(process.env.CRON_SECRET),
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}
