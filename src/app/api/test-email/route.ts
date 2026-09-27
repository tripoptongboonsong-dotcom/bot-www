import { NextRequest, NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let email: string | undefined;
    try {
      const body = await request.json();
      email = body.email;
    } catch {
      // ignore json parse error if empty
    }

    const result = await sendTestEmail(email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'ส่งอีเมลทดสอบเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ',
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'ไม่สามารถส่งอีเมลได้',
        },
        { status: 400 }
      );
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
