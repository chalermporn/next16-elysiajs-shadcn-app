'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/eden';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const tokenError = !tokenFromUrl ? 'ไม่มีลิงก์รีเซ็ต กรุณาขอลิงก์ใหม่' : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (!tokenFromUrl) return;
    setLoading(true);
    const res = await api.auth['reset-password'].post({
      token: tokenFromUrl,
      password,
    });
    setLoading(false);

    if (res.error) {
      const err = res.error as
        | { value?: Record<string, unknown>; error?: string }
        | string
        | undefined;
      let msg = 'ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาขอลิงก์ใหม่';
      if (typeof err === 'object' && err?.value && typeof err.value === 'object') {
        const o = err.value as Record<string, unknown>;
        if (typeof o.error === 'string') msg = o.error;
      } else if (typeof err === 'string') msg = err;
      setError(msg);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push('/login'), 2000);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-background via-primary/6 to-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.18_252/0.18),transparent)] pointer-events-none" aria-hidden />
        <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xl shadow-primary/5 overflow-hidden p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <KeyRound size={32} className="text-primary" aria-hidden />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">รีเซ็ตรหัสผ่านสำเร็จ</h2>
          <p className="text-muted-foreground text-sm mb-6">
            กำลังนำคุณไปหน้าเข้าสู่ระบบ...
          </p>
          <Link href="/login">
            <Button className="w-full gap-2 cursor-pointer">
              <ArrowLeft size={18} aria-hidden />
              ไปเข้าสู่ระบบเลย
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
            ตั้งรหัสผ่านใหม่
          </h2>
          <p className="text-primary-foreground/85 text-sm mt-2">
            กรอกรหัสผ่านใหม่ที่ต้องการใช้
          </p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {(error || tokenError) && (
              <div
                role="alert"
                className="p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20 font-medium"
              >
                {error || tokenError}
              </div>
            )}
            <div>
              <label htmlFor="reset-password" className="block text-sm font-semibold text-foreground mb-2">
                รหัสผ่านใหม่
              </label>
              <Input
                id="reset-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 border-border rounded-xl bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                minLength={6}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
              />
            </div>
            <div>
              <label htmlFor="reset-confirm" className="block text-sm font-semibold text-foreground mb-2">
                ยืนยันรหัสผ่าน
              </label>
              <Input
                id="reset-confirm"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-4 border-border rounded-xl bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                minLength={6}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold gap-2 shadow-md shadow-primary/25 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              disabled={loading || !tokenFromUrl || !!tokenError}
            >
              {loading ? 'กำลังบันทึก...' : 'รีเซ็ตรหัสผ่าน'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          กำลังโหลด...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
