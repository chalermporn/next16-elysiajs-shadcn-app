'use client';

import { useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/eden';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDevResetUrl(null);
    setLoading(true);
    const res = await api.auth['forgot-password'].post({ email });
    setLoading(false);

    if (res.error) {
      const err = res.error as
        | { value?: Record<string, unknown>; error?: string }
        | string
        | undefined;
      let msg = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      if (typeof err === 'object' && err?.value && typeof err.value === 'object') {
        const o = err.value as Record<string, unknown>;
        if (typeof o.error === 'string') msg = o.error;
      } else if (typeof err === 'string') msg = err;
      setError(msg);
      return;
    }

    const data = res.data as
      | { ok?: boolean; message?: string; devResetUrl?: string }
      | undefined;
    setSuccess(true);
    if (data?.devResetUrl) setDevResetUrl(data.devResetUrl);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-primary/6 to-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.18_252/0.18),transparent)] pointer-events-none" aria-hidden />
        <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xl shadow-primary/5 overflow-hidden p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <KeyRound size={32} className="text-primary" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">ส่งอีเมลแล้ว</h2>
          <p className="text-muted-foreground text-sm mb-6">
            หากอีเมลนี้มีในระบบ คุณจะได้รับลิงก์รีเซ็ตรหัสผ่าน (ตรวจสอบโฟลเดอร์สแปมด้วย)
          </p>
          {devResetUrl && (
            <div className="mb-6 p-4 bg-muted/50 rounded-xl text-left">
              <p className="text-xs font-semibold text-muted-foreground mb-2">[DEV] ลิงก์รีเซ็ตรหัสผ่าน:</p>
              <a
                href={devResetUrl}
                className="text-sm text-primary break-all hover:underline cursor-pointer"
              >
                {devResetUrl}
              </a>
            </div>
          )}
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full gap-2 cursor-pointer"
            >
              <ArrowLeft size={18} aria-hidden />
              กลับไปเข้าสู่ระบบ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/6 to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.18_252/0.18),transparent)] pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xl shadow-primary/5 overflow-hidden">
        <div className="relative bg-linear-to-br from-primary via-primary to-primary/85 px-8 py-10 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-3xl -mr-12 -mt-12" aria-hidden />
          <div className="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/25 shadow-lg">
            <KeyRound size={32} className="text-primary-foreground" strokeWidth={2} aria-hidden />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">
            ลืมรหัสผ่าน?
          </h2>
          <p className="text-primary-foreground/85 text-sm mt-2">
            กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
          </p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium"
              >
                {error}
              </div>
            )}
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-semibold text-foreground mb-2">
                อีเมล
              </label>
              <Input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 border-border rounded-xl bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                placeholder="อีเมลที่สมัครไว้"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold gap-2 shadow-md shadow-primary/25 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              disabled={loading}
            >
              {loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
              <ChevronRight size={20} aria-hidden />
            </Button>
          </form>
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200"
            >
              <ArrowLeft size={16} aria-hidden />
              กลับไปเข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
