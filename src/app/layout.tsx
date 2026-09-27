import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ระบบตรวจสอบสถานะเว็บ CGD (Uptime Monitor)',
  description: 'ตรวจสอบสถานะเว็บ https://gcfa.cgd.go.th/login ทุกๆ 120 วินาที พร้อมส่งอีเมลแจ้งเตือนเมื่อระบบล่มไปยัง tripop.t.ba.project@gmail.com',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
