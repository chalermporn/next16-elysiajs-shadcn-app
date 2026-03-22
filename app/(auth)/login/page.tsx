'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/eden';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard/todos';
  const [email, setEmail] = useState('admin@app.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await api.auth.login.post({ email, password });
    setLoading(false);

    if (res.error) {
      const err = res.error as { value?: Record<string, unknown>; error?: string; message?: string } | string | undefined;
      let msg = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      if (typeof err === 'string') {
        try {
          const parsed = JSON.parse(err) as Record<string, unknown>;
          msg = (parsed.error as string) || (parsed.message as string) || msg;
        } catch {
          msg = err;
        }
      } else if (err && typeof err === 'object' && err !== null) {
        const body = err.value || err;
        const o = body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
        if (o && typeof o.error === 'string') msg = o.error;
        else if (o && typeof o.message === 'string') msg = o.message;
        else if (typeof err.error === 'string') msg = err.error;
        else if (typeof err.message === 'string') msg = err.message;
      }
      setError(String(msg));
      return;
    }
    const data = res.data as { user?: { role?: string } } | undefined;
    const user = data?.user;
    if (user?.role === 'admin') {
      router.push(from.startsWith('/dashboard') ? from : '/dashboard/overview');
    } else {
      router.push('/dashboard/todos');
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/6 to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.18_252/0.18),transparent)] pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xl shadow-primary/5 overflow-hidden transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative bg-linear-to-br from-primary via-primary to-primary/85 px-8 py-10 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-3xl -mr-12 -mt-12" aria-hidden />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-8 -mb-8" aria-hidden />
          <div className="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/25 shadow-lg">
            <CheckCircle2 size={36} className="text-primary-foreground" strokeWidth={2} aria-hidden />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">ยินดีต้อนรับ</h2>
          <p className="text-primary-foreground/85 text-sm mt-2">เข้าสู่ระบบเพื่อจัดการงานของคุณ</p>
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
              <label htmlFor="login-email" className="block text-sm font-semibold text-foreground mb-2">
                อีเมล
              </label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 border-border rounded-xl bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-foreground mb-2">
                รหัสผ่าน
              </label>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-4 border-border rounded-xl bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold gap-2 shadow-md shadow-primary/25 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              disabled={loading}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              <ChevronRight size={20} aria-hidden />
            </Button>
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors duration-200"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <Link
              href="/register"
              className="text-primary font-semibold hover:underline underline-offset-4 cursor-pointer transition-colors duration-200"
            >
              สร้างบัญชีใหม่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
          กำลังโหลด...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
