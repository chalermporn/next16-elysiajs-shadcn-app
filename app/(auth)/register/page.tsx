'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/eden';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setLoading(true);
    const res = await api.auth.register.post({ email, password, name });
    setLoading(false);

    if (res.error) {
      const err = res.error as { error?: string; message?: string };
      toast.error(err.error || err.message || 'สมัครสมาชิกไม่สำเร็จ');
      return;
    }
    toast.success('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden border-slate-100 shadow-xl">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
            สร้างบัญชีใหม่
          </h2>
          <p className="text-slate-500 text-center mb-8 text-sm">
            เริ่มต้นจัดการงานกับ TodoFlow ได้ฟรี
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                ชื่อ-นามสกุล
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                อีเมล
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                รหัสผ่าน
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full py-3.5"
              variant="default"
              disabled={loading}
            >
              {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิกเลย'}
            </Button>
          </form>
          <div className="mt-8 text-center text-sm text-slate-500">
            มีบัญชีอยู่แล้ว?{' '}
            <Link
              href="/login"
              className="text-blue-600 font-bold hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
