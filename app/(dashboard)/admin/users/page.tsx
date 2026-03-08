'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/eden';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.users.get();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: { name: string; email: string; password: string; role: 'admin' | 'user' }) => {
      const res = await api.users.post(body);
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
      toast.success('สร้างผู้ใช้แล้ว');
    },
    onError: (err: Error) => {
      setError(err.message || 'อีเมลนี้มีในระบบแล้ว');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.users({ id }).delete();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('ลบผู้ใช้แล้ว');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'admin' | 'user' }) => {
      const res = await api.users({ id }).patch({ role });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('อัปเดตสิทธิ์แล้ว');
    },
  });

  const users = ((data as { items?: UserItem[] })?.items ?? []) as UserItem[];

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setError('');
    setIsAdding(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name || !formData.email || !formData.password) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string, role: string) => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (role === 'admin' && adminCount <= 1) {
      alert('ไม่สามารถลบ Admin คนสุดท้ายได้');
      return;
    }
    if (confirm('ยืนยันการลบผู้ใช้งานและงานทั้งหมดที่เกี่ยวข้อง? (ลบแล้วกู้คืนไม่ได้)')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            จัดการบัญชีผู้ใช้
          </h2>
        </div>
        {!isAdding && (
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus size={18} className="inline mr-2" /> สร้างผู้ใช้ใหม่
          </Button>
        )}
      </div>

      <Dialog open={isAdding} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent size="md" className="p-0 max-h-[90dvh] flex flex-col sm:max-w-lg">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-blue-500" />
          <DialogHeader className="flex-shrink-0 border-b border-slate-100 dark:border-slate-700 px-4 sm:px-6 py-4 sm:py-5">
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
              สร้างบัญชีผู้ใช้ใหม่
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    ชื่อ-นามสกุล
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    อีเมล
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    รหัสผ่านชั่วคราว
                  </label>
                  <Input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="เช่น password123"
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl min-h-[44px]"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    สิทธิ์การใช้งาน (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 min-h-[44px] outline-none focus:border-blue-500"
                  >
                    <option value="user">User (ทั่วไป)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-slate-100 dark:border-slate-700 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
              <Button type="button" variant="outline" onClick={resetForm}>
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
              >
                บันทึกข้อมูล
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
            >
              {u.role === 'admin' && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-100 dark:from-amber-900/30 to-transparent rounded-tr-3xl rounded-bl-full z-0" />
              )}
              <div className="flex items-start gap-4 mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-xl text-slate-500 dark:text-slate-300 font-bold border border-slate-100 dark:border-slate-600 shadow-sm">
                  {(u.name || u.email).charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">
                    {u.name || u.email}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                    {u.email}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700 relative z-10">
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                    u.role === 'admin'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {u.role === 'admin' ? '⭐ Admin' : 'User'}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-semibold"
                    onClick={() =>
                      updateRoleMutation.mutate({
                        id: u.id,
                        role: u.role === 'admin' ? 'user' : 'admin',
                      })
                    }
                  >
                    สลับ Role
                  </Button>
                  {u.email !== 'admin@app.com' && (
                    <button
                      onClick={() => handleDelete(u.id, u.role)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
