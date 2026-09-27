import { CheckResult } from '@/types';
import { DEFAULT_TARGET_URL, formatThaiDateTime, sendDowntimeAlert, sendRecoveryAlert } from './email';
import { recordCheckResult } from './store';

const TIMEOUT_MS = 15000; // 15 seconds timeout

export async function checkWebsite(
  url: string = process.env.TARGET_URL || DEFAULT_TARGET_URL
): Promise<{
  result: CheckResult;
  alertSent: boolean;
  alertType: 'DOWN' | 'RECOVERY' | 'NONE';
  alertError?: string;
}> {
  const startTime = Date.now();
  const timestamp = new Date();
  const isoTime = timestamp.toISOString();
  const thaiTime = formatThaiDateTime(timestamp);

  let result: CheckResult;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'th,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
      redirect: 'follow',
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isUp = response.status >= 200 && response.status < 400;

    result = {
      url,
      status: isUp ? 'UP' : 'DOWN',
      statusCode: response.status,
      statusText: response.statusText || (isUp ? 'OK' : 'Error'),
      latencyMs,
      timestamp: isoTime,
      thaiTime,
      error: isUp ? undefined : `Server returned HTTP ${response.status} ${response.statusText}`,
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    let errorMessage = 'Unknown network error';

    if (err instanceof Error) {
      const cause = (err as unknown as { cause?: { code?: string; message?: string } }).cause;
      if (err.name === 'AbortError') {
        errorMessage = `Connection timed out after ${TIMEOUT_MS / 1000}s`;
      } else if (cause) {
        errorMessage = `${err.message} (${cause.code || cause.message || ''})`;
      } else {
        errorMessage = err.message;
      }
    }

    result = {
      url,
      status: 'DOWN',
      statusCode: null,
      statusText: 'Connection Failed',
      latencyMs,
      timestamp: isoTime,
      thaiTime,
      error: errorMessage,
    };
  }

  // Update store and evaluate alert condition
  const { shouldSendAlert, alertType } = recordCheckResult(result);

  let alertSent = false;
  let alertError: string | undefined;

  if (shouldSendAlert) {
    if (alertType === 'DOWN') {
      const emailResult = await sendDowntimeAlert(result);
      alertSent = emailResult.success;
      alertError = emailResult.error;
      result.emailSent = emailResult.success;
      result.emailError = emailResult.error;
    } else if (alertType === 'RECOVERY') {
      const emailResult = await sendRecoveryAlert(result);
      alertSent = emailResult.success;
      alertError = emailResult.error;
      result.emailSent = emailResult.success;
      result.emailError = emailResult.error;
    }
  }

  return {
    result,
    alertSent,
    alertType,
    alertError,
  };
}
