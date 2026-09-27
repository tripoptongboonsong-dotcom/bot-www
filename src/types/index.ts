export interface CheckResult {
  url: string;
  status: 'UP' | 'DOWN' | 'ERROR';
  statusCode: number | null;
  statusText: string;
  latencyMs: number;
  timestamp: string; // ISO String
  thaiTime: string;  // Thai formatted string
  error?: string;
  emailSent?: boolean;
  emailError?: string;
}

export interface MonitorState {
  currentStatus: 'UP' | 'DOWN' | 'UNKNOWN';
  lastCheck: CheckResult | null;
  consecutiveFailures: number;
  lastDownTimestamp: string | null;
  lastDownThaiTime: string | null;
  lastAlertSentAt: string | null;
  history: CheckResult[];
  totalChecks: number;
  totalDownIncidents: number;
  averageLatencyMs: number;
}
