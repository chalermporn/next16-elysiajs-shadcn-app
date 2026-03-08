'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/eden';
import { toast } from 'sonner';

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-xl rotate-3">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">ยินดีต้อนรับ</h2>
          <p className="text-blue-100 text-sm">เข้าสู่ระบบเพื่อจัดการงานของคุณ</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-2">อีเมล</label>
              <Input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-2">รหัสผ่าน</label>
              <Input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 active:scale-95"
              disabled={loading}
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'} <ChevronRight size={20} />
            </Button>
          </form>
          <div className="mt-8 text-center text-sm text-slate-500">
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <Link href="/register" className="text-amber-600 font-bold hover:underline">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">กำลังโหลด...</div>}>
      <LoginForm />
    </Suspense>
  );
}
