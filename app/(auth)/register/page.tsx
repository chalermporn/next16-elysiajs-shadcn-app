'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">สร้างบัญชีใหม่</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">เริ่มต้นจัดการงานกับ TodoFlow ได้ฟรี</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium text-center">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="register-name" className="block text-sm font-semibold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
            <Input
              id="register-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="register-email" className="block text-sm font-semibold text-slate-700 mb-1">อีเมล</label>
            <Input
              id="register-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label htmlFor="register-password" className="block text-sm font-semibold text-slate-700 mb-1">รหัสผ่าน</label>
            <Input
              id="register-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-amber-500/30"
            disabled={loading}
          >
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิกเลย'}
          </Button>
        </form>
        <div className="mt-8 text-center text-sm text-slate-500">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="text-blue-600 font-bold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </div>
      </div>
    </div>
  );
}
