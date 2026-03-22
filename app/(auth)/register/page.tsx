'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/eden';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) {
      setError('กรอกข้อมูลให้ครบทุกช่อง');
      return;
    }
    setLoading(true);
    const res = await api.auth.register.post({ email, password, name });
    setLoading(false);

    if (res.error) {
      const err = res.error as { value?: Record<string, unknown>; error?: string; message?: string } | string | undefined;
      let msg = 'อีเมลนี้มีผู้ใช้งานแล้ว';
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
    alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอิน');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-primary/6 to-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.18_252/0.18),transparent)] pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xl shadow-primary/5 overflow-hidden transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative bg-linear-to-br from-primary via-primary to-primary/85 px-8 py-10 text-center overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/15 rounded-full blur-3xl -mr-12 -mt-12" aria-hidden />
          <div className="relative w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-5 border border-white/25 shadow-lg">
            <UserPlus size={32} className="text-primary-foreground" strokeWidth={2} aria-hidden />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">สร้างบัญชีใหม่</h2>
          <p className="text-primary-foreground/85 text-sm mt-2">เริ่มต้นจัดการงานกับ TodoFlow ได้ฟรี</p>
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
              <label htmlFor="register-name" className="block text-sm font-semibold text-foreground mb-2">
                ชื่อ-นามสกุล
              </label>
              <Input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-4 border-border rounded-xl bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-semibold text-foreground mb-2">
                อีเมล
              </label>
              <Input
                id="register-email"
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
              <label htmlFor="register-password" className="block text-sm font-semibold text-foreground mb-2">
                รหัสผ่าน
              </label>
              <Input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full h-11 px-4 border-border rounded-xl bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold gap-2 shadow-md shadow-primary/25 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
              disabled={loading}
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิกเลย'}
              <ChevronRight size={20} aria-hidden />
            </Button>
          </form>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            มีบัญชีอยู่แล้ว?{' '}
            <Link
              href="/login"
              className="text-primary font-semibold hover:underline underline-offset-4 cursor-pointer transition-colors duration-200"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
