'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { api } from '@/lib/eden';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';

const PAGE_SIZES = [10, 20, 50] as const;
type ViewMode = 'table' | 'card';

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  role: string;
};

function UserCard({
  u,
  onEdit,
  onDelete,
  onToggleRole,
}: {
  u: UserItem;
  onEdit: (u: UserItem) => void;
  onDelete: (id: string, role: string) => void;
  onToggleRole: (id: string, role: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
      {u.role === 'admin' && (
        <div className="absolute top-0 right-0 w-14 h-14 sm:w-16 sm:h-16 bg-linear-to-bl from-amber-100 dark:from-amber-900/30 to-transparent rounded-tr-2xl rounded-bl-full z-0" />
      )}
      <div className="flex items-start gap-4 mb-4 relative z-10">
        <Avatar className="size-12 sm:size-14 rounded-xl shrink-0">
          {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.name ?? u.email} /> : null}
          <AvatarFallback className="rounded-xl text-lg sm:text-xl">
            {(u.name || u.email).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">
            {u.name || u.email}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{u.email}</p>
        </div>
      </div>
      <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-border relative z-10">
        <span
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border ${
            u.role === 'admin'
              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          {u.role === 'admin' ? 'Admin' : 'User'}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9 min-w-[44px] sm:min-w-0"
            onClick={() => onEdit(u)}
          >
            <Pencil size={16} className="sm:mr-1" />
            <span className="hidden sm:inline">แก้ไข</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 min-w-[44px] sm:min-w-0"
            onClick={() => onToggleRole(u.id, u.role)}
          >
            สลับ
          </Button>
          {u.email !== 'admin@app.com' && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 min-w-[44px] text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              onClick={() => onDelete(u.id, u.role)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function UserTableRow({
  u,
  onEdit,
  onDelete,
  onToggleRole,
}: {
  u: UserItem;
  onEdit: (u: UserItem) => void;
  onDelete: (id: string, role: string) => void;
  onToggleRole: (id: string, role: string) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-10 rounded-lg shrink-0">
            {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt={u.name ?? u.email} /> : null}
            <AvatarFallback className="rounded-lg text-sm">
              {(u.name || u.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{u.name || u.email}</p>
            <p className="text-xs text-muted-foreground truncate sm:hidden">{u.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
      <TableCell>
        <span
          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${
            u.role === 'admin'
              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {u.role}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1 sm:gap-2">
          <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={() => onEdit(u)}>
            <Pencil size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-9 px-2 sm:px-3"
            onClick={() => onToggleRole(u.id, u.role)}
          >
            สลับ
          </Button>
          {u.email !== 'admin@app.com' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(u.id, u.role)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  useUser();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });
  const [editFormData, setEditFormData] = useState({ name: '', role: 'user' as 'admin' | 'user' });
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, limit],
    queryFn: async () => {
      const res = await api.users.get({
        query: { page: String(page), limit: String(limit) },
      });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data as { items: UserItem[]; total: number; page: number; limit: number };
    },
  });

  const users = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

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

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, role }: { id: string; name: string; role: 'admin' | 'user' }) => {
      const res = await api.users({ id }).patch({ name: name || undefined, role });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast.success('อัปเดตผู้ใช้แล้ว');
    },
    onError: (err: Error) => {
      setError(err.message || 'แก้ไขไม่สำเร็จ');
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
      if (page > 1 && users.length <= 1) setPage((p) => Math.max(1, p - 1));
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

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setError('');
    setIsAdding(false);
  };

  const openEdit = (u: UserItem) => {
    setEditingUser(u);
    setEditFormData({ name: u.name ?? '', role: u.role as 'admin' | 'user' });
    setError('');
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

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    updateMutation.mutate({ id: editingUser.id, name: editFormData.name, role: editFormData.role });
  };

  const handleDelete = (id: string, role: string) => {
    const adminCount = users.filter((u) => u.role === 'admin').length;
    if (role === 'admin' && adminCount <= 1) {
      toast.error('ไม่สามารถลบ Admin คนสุดท้ายได้');
      return;
    }
    if (confirm('ยืนยันการลบผู้ใช้งานและงานทั้งหมดที่เกี่ยวข้อง? (ลบแล้วกู้คืนไม่ได้)')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleRole = (id: string, role: string) => {
    updateRoleMutation.mutate({ id, role: role === 'admin' ? 'user' : 'admin' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          จัดการบัญชีผู้ใช้
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'card'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <LayoutGrid size={18} />
              <span className="hidden sm:inline">การ์ด</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              <List size={18} />
              <span className="hidden sm:inline">ตาราง</span>
            </button>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            <Plus size={18} className="mr-2" />
            สร้างผู้ใช้ใหม่
          </Button>
        </div>
      </div>

      {/* Create Modal */}
      <Dialog open={isAdding} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent size="md" className="p-0 max-h-[90dvh] flex flex-col sm:max-w-lg">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-blue-500" />
          <DialogHeader className="shrink-0 border-b border-border px-4 sm:px-6 py-4 sm:py-5">
            <DialogTitle>สร้างบัญชีผู้ใช้ใหม่</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="admin-create-name" className="block text-sm font-semibold mb-1.5">ชื่อ-นามสกุล</label>
                  <Input
                    id="admin-create-name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="admin-create-email" className="block text-sm font-semibold mb-1.5">อีเมล</label>
                  <Input
                    id="admin-create-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="admin-create-password" className="block text-sm font-semibold mb-1.5">รหัสผ่านชั่วคราว</label>
                  <Input
                    id="admin-create-password"
                    name="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="เช่น password123"
                    className="min-h-[44px]"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="admin-create-role" className="block text-sm font-semibold mb-1.5">สิทธิ์การใช้งาน (Role)</label>
                  <select
                    id="admin-create-role"
                    name="role"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })
                    }
                    className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background min-h-[44px] outline-none focus:border-ring"
                  >
                    <option value="user">User (ทั่วไป)</option>
                    <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t border-border px-4 sm:px-6 py-4">
              <Button type="button" variant="outline" onClick={resetForm}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                บันทึกข้อมูล
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent size="md" className="p-0 max-h-[90dvh] flex flex-col sm:max-w-lg">
          <div className="absolute left-0 top-0 h-1 w-full rounded-t-2xl bg-blue-500" />
          <DialogHeader className="shrink-0 border-b border-border px-4 sm:px-6 py-4 sm:py-5">
            <DialogTitle>แก้ไขผู้ใช้</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
                  {error}
                </div>
              )}
              {editingUser && (
                <>
                  <div>
                    <label htmlFor="admin-edit-email" className="block text-sm font-semibold mb-1.5">อีเมล</label>
                    <Input id="admin-edit-email" name="email" value={editingUser.email} disabled className="min-h-[44px] opacity-70" />
                    <p className="text-xs text-muted-foreground mt-1">ไม่สามารถแก้ไขอีเมลได้</p>
                  </div>
                  <div>
                    <label htmlFor="admin-edit-name" className="block text-sm font-semibold mb-1.5">ชื่อ-นามสกุล</label>
                    <Input
                      id="admin-edit-name"
                      name="name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin-edit-role" className="block text-sm font-semibold mb-1.5">สิทธิ์การใช้งาน (Role)</label>
                    <select
                      id="admin-edit-role"
                      name="role"
                      value={editFormData.role}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, role: e.target.value as 'admin' | 'user' })
                      }
                      className="w-full px-4 py-3 rounded-xl border-2 border-input bg-background min-h-[44px] outline-none focus:border-ring"
                    >
                      <option value="user">User (ทั่วไป)</option>
                      <option value="admin">Admin (ผู้ดูแลระบบ)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter className="shrink-0 border-t border-border px-4 sm:px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                บันทึกการแก้ไข
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground">กำลังโหลด...</div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground rounded-2xl border border-dashed border-border">
          ยังไม่มีผู้ใช้
        </div>
      ) : (
        <>
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {users.map((u) => (
                <UserCard
                  key={u.id}
                  u={u}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggleRole={handleToggleRole}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อ</TableHead>
                      <TableHead className="hidden sm:table-cell">อีเมล</TableHead>
                      <TableHead>สิทธิ์</TableHead>
                      <TableHead className="text-right w-24 sm:w-40">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <UserTableRow
                        key={u.id}
                        u={u}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onToggleRole={handleToggleRole}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  แสดง {start}-{end} จาก {total}
                </span>
                <select
                  id="pagination-limit"
                  name="limit"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-9 px-3 rounded-lg border border-input bg-background text-sm"
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s} รายการ/หน้า
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="min-w-[44px]"
                >
                  ก่อนหน้า
                </Button>
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  หน้า {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="min-w-[44px]"
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
