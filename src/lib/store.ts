import { CheckResult, MonitorState } from '@/types';

// Global in-memory state across serverless invocations (warm lambdas)
// and singleton pattern for Node runtime
declare global {
  // eslint-disable-next-line no-var
  var __MONITOR_STATE__: MonitorState | undefined;
}

const DEFAULT_STATE: MonitorState = {
  currentStatus: 'UNKNOWN',
  lastCheck: null,
  consecutiveFailures: 0,
  lastDownTimestamp: null,
  lastDownThaiTime: null,
  lastAlertSentAt: null,
  history: [],
  totalChecks: 0,
  totalDownIncidents: 0,
  averageLatencyMs: 0,
  isEmailAlertEnabled: true,
};

export function getMonitorState(): MonitorState {
  if (!global.__MONITOR_STATE__) {
    global.__MONITOR_STATE__ = { ...DEFAULT_STATE };
  }
  return global.__MONITOR_STATE__;
}

export function setEmailAlertEnabled(enabled: boolean): boolean {
  const state = getMonitorState();
  state.isEmailAlertEnabled = enabled;
  return state.isEmailAlertEnabled;
}

export function recordCheckResult(result: CheckResult): {
  state: MonitorState;
  shouldSendAlert: boolean;
  alertType: 'DOWN' | 'RECOVERY' | 'NONE';
} {
  const state = getMonitorState();
  const previousStatus = state.currentStatus;
  
  state.lastCheck = result;
  state.totalChecks += 1;
  
  // Calculate average latency (running average of last 20 successful checks)
  if (result.status === 'UP' && result.latencyMs > 0) {
    if (state.averageLatencyMs === 0) {
      state.averageLatencyMs = result.latencyMs;
    } else {
      state.averageLatencyMs = Math.round(
        state.averageLatencyMs * 0.8 + result.latencyMs * 0.2
      );
    }
  }

  // Prepend to history (keep latest 50 records)
  state.history = [result, ...state.history].slice(0, 50);

  let shouldSendAlert = false;
  let alertType: 'DOWN' | 'RECOVERY' | 'NONE' = 'NONE';

  if (result.status === 'DOWN' || result.status === 'ERROR') {
    state.consecutiveFailures += 1;
    state.currentStatus = 'DOWN';

    if (previousStatus !== 'DOWN') {
      // First time going down!
      state.totalDownIncidents += 1;
      state.lastDownTimestamp = result.timestamp;
      state.lastDownThaiTime = result.thaiTime;
      shouldSendAlert = state.isEmailAlertEnabled !== false;
      alertType = 'DOWN';
      state.lastAlertSentAt = result.timestamp;
    } else {
      // Still down - check if cooldown has passed (e.g. reminder every 30 minutes)
      const lastAlertTime = state.lastAlertSentAt
        ? new Date(state.lastAlertSentAt).getTime()
        : 0;
      const now = new Date(result.timestamp).getTime();
      const cooldownMs = 30 * 60 * 1000; // 30 minutes reminder

      if (now - lastAlertTime >= cooldownMs) {
        shouldSendAlert = state.isEmailAlertEnabled !== false;
        alertType = 'DOWN';
        state.lastAlertSentAt = result.timestamp;
      }
    }
  } else if (result.status === 'UP') {
    state.consecutiveFailures = 0;
    if (previousStatus === 'DOWN') {
      // Recovered! Send recovery notification
      shouldSendAlert = state.isEmailAlertEnabled !== false;
      alertType = 'RECOVERY';
    }
    state.currentStatus = 'UP';
  }

  return { state, shouldSendAlert, alertType };
}

export function resetMonitorHistory(): void {
  global.__MONITOR_STATE__ = { ...DEFAULT_STATE };
}
