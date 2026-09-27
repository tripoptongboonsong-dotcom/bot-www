import { NextRequest, NextResponse } from 'next/server';
import { checkWebsite } from '@/lib/monitor';
import { getMonitorState } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const urlParam = request.nextUrl.searchParams.get('url');

    // Optional secret check if invoked by external cron
    const isCronRequest = request.nextUrl.searchParams.get('cron') === 'true';
    if (isCronRequest && cronSecret) {
      const token = request.nextUrl.searchParams.get('key') || authHeader?.replace('Bearer ', '');
      if (token !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized. Invalid cron key.' }, { status: 401 });
      }
    }

    const { result, alertSent, alertType, alertError } = await checkWebsite(urlParam || undefined);
    const state = getMonitorState();

    return NextResponse.json({
      success: true,
      result,
      alert: {
        sent: alertSent,
        type: alertType,
        error: alertError,
      },
      summary: {
        currentStatus: state.currentStatus,
        totalChecks: state.totalChecks,
        totalDownIncidents: state.totalDownIncidents,
        averageLatencyMs: state.averageLatencyMs,
        lastDownThaiTime: state.lastDownThaiTime,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
