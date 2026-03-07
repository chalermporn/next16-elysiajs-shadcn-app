'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/eden';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.users.get();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
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
    mutationFn: async ({
      id,
      role,
    }: {
      id: string;
      role: 'admin' | 'user';
    }) => {
      const res = await api.users({ id }).patch({ role });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('อัปเดตสิทธิ์แล้ว');
    },
  });

  const { user } = useUser();
  const users = (data as { items?: Array<{ id: string; name?: string; email: string; role: string }> } | undefined)?.items ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            จัดการบัญชีผู้ใช้
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            กำหนดสิทธิ์และดูแลผู้ใช้งานในระบบ
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500">กำลังโหลด...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.map((u: { id: string; name?: string; email: string; role: string }) => (
            <div
              key={u.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all relative"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-xl text-slate-500 font-bold border border-slate-100">
                  {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-slate-800 truncate">
                    {u.name || u.email}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <Badge
                  variant={u.role === 'admin' ? 'default' : 'secondary'}
                  className={
                    u.role === 'admin'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : ''
                  }
                >
                  {u.role === 'admin' ? '⭐ Admin' : 'User'}
                </Badge>
                <div className="flex gap-2">
                  {u.id !== user?.id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateRoleMutation.mutate({
                            id: u.id,
                            role: u.role === 'admin' ? 'user' : 'admin',
                          })
                        }
                      >
                        สลับ Role
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('ยืนยันการลบ?'))
                            deleteMutation.mutate(u.id);
                        }}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </>
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
