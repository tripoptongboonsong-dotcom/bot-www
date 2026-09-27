'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Mail,
  ExternalLink,
  ShieldCheck,
  Server,
  Activity,
  Bell,
  Play,
  Pause,
  Send,
  HelpCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { CheckResult, MonitorState } from '@/types';

export default function Dashboard() {
  const [config, setConfig] = useState({
    targetUrl: 'https://gcfa.cgd.go.th/login',
    alertEmail: 'tripop.t.ba.project@gmail.com',
    intervalSeconds: 120,
    hasSmtpConfigured: false,
  });

  const [state, setState] = useState<MonitorState>({
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
  });

  const [isChecking, setIsChecking] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const [isAutoCheckActive, setIsAutoCheckActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailFeedback, setTestEmailFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [showDeploymentGuide, setShowDeploymentGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Play audio notification on alert
  const playAlertSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // Audio not permitted or supported
    }
  }, [soundEnabled]);

  // Fetch current state & config
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        if (data.state && data.state.lastCheck) {
          setState(data.state);
        }
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  }, []);

  // Perform website check
  const performCheck = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/check');
      const data = await res.json();

      if (data.success && data.result) {
        const checkRes: CheckResult = data.result;

        // If down, play sound
        if (checkRes.status === 'DOWN') {
          playAlertSound();
        }

        // Re-fetch status to get updated history
        await fetchStatus();
      }
    } catch (err) {
      console.error('Check failed:', err);
    } finally {
      setIsChecking(false);
      setCountdown(config.intervalSeconds || 120);
    }
  }, [config.intervalSeconds, fetchStatus, playAlertSound]);

  // Initial load
  useEffect(() => {
    fetchStatus();
    // Do initial check on load if no checks yet
    performCheck();
  }, [fetchStatus, performCheck]);

  // 120s countdown timer
  useEffect(() => {
    if (!isAutoCheckActive) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          performCheck();
          return config.intervalSeconds || 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAutoCheckActive, config.intervalSeconds, performCheck]);

  // Send test email
  const handleTestEmail = async () => {
    setTestEmailLoading(true);
    setTestEmailFeedback(null);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: config.alertEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailFeedback({
          type: 'success',
          message: `ส่งอีเมลทดสอบไปยัง ${config.alertEmail} สำเร็จเรียบร้อย!`,
        });
      } else {
        setTestEmailFeedback({
          type: 'error',
          message: data.error || 'ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า SMTP',
        });
      }
    } catch {
      setTestEmailFeedback({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
      });
    } finally {
      setTestEmailLoading(false);
    }
  };

  const copyApiUrl = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/api/check`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const progressPercent = Math.max(
    0,
    Math.min(100, ((config.intervalSeconds - countdown) / config.intervalSeconds) * 100)
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  ระบบตรวจจับเว็บล่มอัตโนมัติ
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">
                    24/7 Monitor
                  </span>
                </h1>
                <p className="text-sm text-slate-400">
                  ตรวจสอบเป้าหมายทุกๆ 120 วินาที พร้อมส่งอีเมลแจ้งเตือนวันเวลาเมื่อเกิดเว็บล่ม
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'ปิดเสียงแจ้งเตือน' : 'เปิดเสียงแจ้งเตือน'}
              className={`p-2 rounded-lg border text-sm flex items-center gap-1.5 transition-colors ${
                soundEnabled
                  ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-800 bg-slate-950 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{soundEnabled ? 'เสียงเปิด' : 'ปิดเสียง'}</span>
            </button>

            <button
              onClick={() => setShowDeploymentGuide(!showDeploymentGuide)}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              วิธีตั้งค่า Vercel & 24/7
            </button>
          </div>
        </header>

        {/* Target Info Bar */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-400 font-medium">เว็บไซต์เป้าหมาย</div>
              <a
                href={config.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 truncate"
              >
                <span className="truncate">{config.targetUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              </a>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">ความถี่ในการตรวจสอบ</div>
              <div className="text-sm font-semibold text-slate-200">
                ทุกๆ {config.intervalSeconds} วินาที (2 นาที)
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-400 font-medium">อีเมลรับการแจ้งเตือน</div>
              <div className="text-sm font-semibold text-rose-300 truncate" title={config.alertEmail}>
                {config.alertEmail}
              </div>
            </div>
          </div>
        </section>

        {/* Main Status & Monitor Controller */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Status Card (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            {/* Ambient Background Glow based on status */}
            <div
              className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700 ${
                state.currentStatus === 'UP'
                  ? 'bg-emerald-500'
                  : state.currentStatus === 'DOWN'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  สถานะเว็บไซต์ปัจจุบัน
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Realtime Ping
                </span>
              </div>

              {/* Status Indicator */}
              <div className="flex items-start gap-4 mb-6">
                {state.currentStatus === 'UP' ? (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse-slow">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                ) : state.currentStatus === 'DOWN' ? (
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                    <XCircle className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3">
                    <h2
                      className={`text-2xl sm:text-3xl font-extrabold ${
                        state.currentStatus === 'UP'
                          ? 'text-emerald-400'
                          : state.currentStatus === 'DOWN'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {state.currentStatus === 'UP'
                        ? 'ออนไลน์ ปกติ (ONLINE)'
                        : state.currentStatus === 'DOWN'
                        ? 'เว็บไซต์ล่ม (DOWN DETECTED)'
                        : 'กำลังตรวจสอบ...'}
                    </h2>
                    {state.lastCheck?.statusCode && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-800 border border-slate-700 text-slate-300">
                        HTTP {state.lastCheck.statusCode}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {state.currentStatus === 'UP'
                      ? 'เซิร์ฟเวอร์ตอบสนองปกติ สามารถเข้าใช้งานหน้าล็อกอินได้'
                      : state.currentStatus === 'DOWN'
                      ? `ตรวจพบปัญหา: ${state.lastCheck?.error || 'เซิร์ฟเวอร์ไม่ตอบสนอง'}`
                      : 'ระบบกำลังเริ่มการตรวจเช็ค...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
              <div>
                <span className="text-xs text-slate-400">Response Time</span>
                <p className="text-lg font-bold text-slate-100">
                  {state.lastCheck?.latencyMs !== undefined ? `${state.lastCheck.latencyMs} ms` : '-'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">เฉลี่ย (Avg)</span>
                <p className="text-lg font-bold text-slate-100">
                  {state.averageLatencyMs ? `${state.averageLatencyMs} ms` : '-'}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">ตรวจเช็คทั้งหมด</span>
                <p className="text-lg font-bold text-slate-100">{state.totalChecks} ครั้ง</p>
              </div>
              <div>
                <span className="text-xs text-slate-400">ตรวจพบล่มสะสม</span>
                <p className={`text-lg font-bold ${state.totalDownIncidents > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                  {state.totalDownIncidents} ครั้ง
                </p>
              </div>
            </div>

            {/* Last Check Timestamp Banner */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1">
              <span>
                ตรวจเช็คล่าสุดเมื่อ:{' '}
                <strong className="text-slate-200">
                  {state.lastCheck?.thaiTime || 'ยังไม่มีข้อมูล'}
                </strong>
              </span>
              {state.lastDownThaiTime && (
                <span className="text-rose-400 font-medium">
                  ล่มครั้งล่าสุด: {state.lastDownThaiTime}
                </span>
              )}
            </div>
          </div>

          {/* Controller & Countdown Card (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  รอบการตรวจสอบถัดไป
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isAutoCheckActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAutoCheckActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  {isAutoCheckActive ? 'Auto Loop ทำงานอยู่' : 'พักชั่วคราว'}
                </span>
              </div>

              {/* Countdown Display */}
              <div className="text-center py-4">
                <div className="text-5xl sm:text-6xl font-black text-white font-mono tracking-tight">
                  {isChecking ? '...' : `${countdown}s`}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {isChecking
                    ? 'กำลังส่งคำขอตรวจสอบความพร้อมของเซิร์ฟเวอร์...'
                    : `จะส่งคำขอตรวจสอบอัตโนมัติในอีก ${countdown} วินาที`}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsAutoCheckActive(!isAutoCheckActive)}
                  className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border transition-colors ${
                    isAutoCheckActive
                      ? 'border-amber-600/40 bg-amber-600/10 text-amber-300 hover:bg-amber-600/20'
                      : 'border-emerald-600/40 bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600/20'
                  }`}
                >
                  {isAutoCheckActive ? (
                    <>
                      <Pause className="w-4 h-4" /> หยุดตรวจอัตโนมัติ
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> ดำเนินการต่อ
                    </>
                  )}
                </button>

                <button
                  onClick={() => performCheck()}
                  disabled={isChecking}
                  className="px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                  {isChecking ? 'กำลังเช็ค...' : 'ตรวจเช็คเดี๋ยวนี้'}
                </button>
              </div>

              <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1">
                <span>เปิดแท็บหน้านี้ทิ้งไว้ ระบบจะเช็คทุก 120s และส่งอีเมลเมื่อล่มทันที</span>
              </div>
            </div>
          </div>
        </section>

        {/* Email Alert Setup & Testing Card */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ระบบส่งอีเมลแจ้งเตือนเมื่อเว็บล่ม</h3>
                <p className="text-xs text-slate-400">
                  ส่งไปยัง:{' '}
                  <strong className="text-slate-200">{config.alertEmail}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleTestEmail}
                disabled={testEmailLoading}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <Send className={`w-4 h-4 text-blue-400 ${testEmailLoading ? 'animate-bounce' : ''}`} />
                {testEmailLoading ? 'กำลังส่งทดสอบ...' : 'ทดสอบส่งอีเมลทันที'}
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {testEmailFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium mb-4 flex items-center gap-2 ${
                testEmailFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {testEmailFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              )}
              <span>{testEmailFeedback.message}</span>
            </div>
          )}

          {/* SMTP Configuration Tips */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div>
              <span className="font-semibold text-slate-200 block mb-1">
                ⚙️ การตั้งค่าให้ส่งอีเมลจริง (Gmail App Password):
              </span>
              <p className="leading-relaxed">
                เนื่องจาก Gmail ไม่อนุญาตให้ใช้รหัสผ่านปกติส่งอีเมลตรง ให้สร้าง <strong>App Password 16 หลัก</strong> โดยเข้าไปที่{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Google App Passwords
                </a>{' '}
                แล้วนำไปใส่ใน Vercel Environment Variables:
              </p>
            </div>
            <div className="font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div>SMTP_USER=your_sender_email@gmail.com</div>
              <div>SMTP_PASS=xxxx xxxx xxxx xxxx (16 หลัก)</div>
              <div>ALERT_TO_EMAIL=tripop.t.ba.project@gmail.com</div>
            </div>
          </div>
        </section>

        {/* Check History Log Table */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ประวัติการตรวจเช็ค (Live Activity Log)
                <span className="text-xs font-normal text-slate-400">
                  (บันทึก 50 รายการล่าสุด)
                </span>
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">วันและเวลาที่ตรวจสอบ</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4">HTTP Code</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4">การแจ้งเตือนอีเมล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {state.history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                      ยังไม่มีประวัติการตรวจสอบ ระบบจะบันทึกเมื่อมีการส่งคำขอ
                    </td>
                  </tr>
                ) : (
                  state.history.map((item, index) => (
                    <tr
                      key={index}
                      className={
                        item.status === 'DOWN'
                          ? 'bg-rose-950/20 hover:bg-rose-950/30'
                          : 'hover:bg-slate-800/40 transition-colors'
                      }
                    >
                      <td className="py-3 px-4 text-slate-200">
                        {item.thaiTime}
                      </td>
                      <td className="py-3 px-4">
                        {item.status === 'UP' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold font-sans">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ปกติ (UP)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold font-sans">
                            <XCircle className="w-3.5 h-3.5" /> ล่ม (DOWN)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.statusCode || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {item.latencyMs} ms
                      </td>
                      <td className="py-3 px-4 font-sans text-xs">
                        {item.status === 'DOWN' ? (
                          item.emailSent ? (
                            <span className="text-emerald-400 font-medium">
                              ✓ ส่งเข้า {config.alertEmail} แล้ว
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium" title={item.emailError}>
                              {item.emailError ? `ล้มเหลว: ${item.emailError}` : 'ไม่ได้กำหนด SMTP'}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Modal / Section: Vercel Deployment & 24/7 Monitoring Instructions */}
        {showDeploymentGuide && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🚀 วิธี Deploy ขึ้น Vercel และเปิดตรวจ 24 ชม. ทุก 120 วิ
                </h3>
                <button
                  onClick={() => setShowDeploymentGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <div>
                  <h4 className="font-bold text-blue-400 mb-1">ขั้นตอนที่ 1: Deploy ขึ้น Vercel</h4>
                  <p className="text-slate-400 mb-2">
                    คุณสามารถ Deploy ได้ง่ายๆ ผ่าน Git หรือ Vercel CLI:
                  </p>
                  <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto">
                    npx vercel
                  </pre>
                </div>

                <div>
                  <h4 className="font-bold text-blue-400 mb-1">ขั้นตอนที่ 2: ตั้งค่า Environment Variables บน Vercel</h4>
                  <p className="text-slate-400 mb-2">
                    เข้าไปที่หน้า Vercel Project Dashboard &gt; Settings &gt; Environment Variables และเพิ่มค่า:
                  </p>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
                    <div><strong className="text-emerald-400">SMTP_HOST</strong> = smtp.gmail.com</div>
                    <div><strong className="text-emerald-400">SMTP_PORT</strong> = 465</div>
                    <div><strong className="text-emerald-400">SMTP_SECURE</strong> = true</div>
                    <div><strong className="text-emerald-400">SMTP_USER</strong> = อีเมลของคุณที่ใช้ส่ง</div>
                    <div><strong className="text-emerald-400">SMTP_PASS</strong> = รหัส App Password 16 หลักจาก Google</div>
                    <div><strong className="text-emerald-400">ALERT_TO_EMAIL</strong> = tripop.t.ba.project@gmail.com</div>
                    <div><strong className="text-emerald-400">CRON_SECRET</strong> = cgd_monitor_secret_key_2026</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-blue-400 mb-1">
                    ขั้นตอนที่ 3: ทำให้ระบบเช็ค 24 ชั่วโมงแม้ปิดเบราว์เซอร์ (External Cron ฟรี)
                  </h4>
                  <p className="text-slate-400 mb-2">
                    เนื่องจาก Vercel เป็น Serverless คุณสามารถตั้งค่าให้ระบบตรวจอัตโนมัติทุกๆ 120 วินาทีได้ฟรี 100% ผ่านบริการ Webhook เช่น{' '}
                    <a
                      href="https://cron-job.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline font-semibold"
                    >
                      cron-job.org
                    </a>
                    :
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-1">
                    <li>สมัครบัญชีฟรีที่ <a href="https://cron-job.org" target="_blank" className="text-blue-400 underline">cron-job.org</a></li>
                    <li>กด <strong>Create Cronjob</strong></li>
                    <li>
                      ใส่ URL เช็คของเว็บคุณ:{' '}
                      <div className="mt-1 flex items-center gap-2">
                        <code className="bg-slate-950 px-2 py-1 rounded text-emerald-400 text-xs">
                          https://&lt;your-domain&gt;.vercel.app/api/check?cron=true&key=cgd_monitor_secret_key_2026
                        </code>
                        <button
                          onClick={copyApiUrl}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                        >
                          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedUrl ? 'คัดลอกแล้ว' : 'คัดลอก'}
                        </button>
                      </div>
                    </li>
                    <li>ตั้งเวลาความถี่เป็น: <strong>Every 2 minutes (ทุก 2 นาที / 120 วินาที)</strong></li>
                    <li>กด บันทึก (Save) ระบบจะยิงตรวจ 24/7 ตลอดเวลา และส่งอีเมลหาคุณทันทีที่เว็บล่ม</li>
                  </ol>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowDeploymentGuide(false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 pt-6 pb-2">
          CGD Website Uptime Monitoring System • Target: {config.targetUrl} • Deploy on Vercel
        </footer>
      </div>
    </main>
  );
}
