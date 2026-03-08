'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit,
  Save,
  Briefcase,
  X,
} from 'lucide-react';
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

const CATEGORIES = ['Production', 'Marketing', 'Admin'];
const DEFAULT_WORKSPACES = ['Frontend Unit', 'Backend Unit', 'Marketing Team', 'Management', 'Personal'];

type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  category?: string | null;
  priority?: number | null;
  workspaceId?: string | null;
  userId: string;
  workspace?: { name: string } | null;
};

export default function TodosPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const { user } = useUser();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORIES[0],
    priority: 3,
    workspaceId: '' as string,
  });

  const { data: workspacesData } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.workspaces.get();
      if (res.error) return { items: [] };
      return (res.data as { items?: Array<{ id: string; name: string }> }) ?? { items: [] };
    },
  });

  const workspaces = workspacesData?.items ?? [];
  const workspaceOptions = workspaces.length > 0
    ? workspaces.map((w) => ({ id: w.id, name: w.name }))
    : DEFAULT_WORKSPACES.map((name, i) => ({ id: `dummy-${i}`, name }));

  const { data, isLoading } = useQuery({
    queryKey: ['todos', q || undefined],
    queryFn: async () => {
      const res = await api.todos.get({
        query: q ? { q } : undefined,
      });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: {
      title: string;
      category?: string;
      priority?: number;
      workspaceId?: string | null;
    }) => {
      const res = await api.todos.post(body);
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      resetForm();
      toast.success('เพิ่มงานแล้ว');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { title?: string; category?: string; priority?: number; workspaceId?: string | null };
    }) => {
      const res = await api.todos({ id }).patch(body);
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      resetForm();
      toast.success('แก้ไขแล้ว');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await api.todos({ id }).patch({ completed });
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.todos({ id }).delete();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('ลบงานแล้ว');
    },
  });

  const items = ((data as { items?: TodoItem[] })?.items ?? []) as TodoItem[];
  const myTodos = user?.role === 'admin' ? items : items.filter((t) => t.userId === user?.id);
  const filtered =
    filter === 'active'
      ? myTodos.filter((t) => !t.completed)
      : filter === 'completed'
        ? myTodos.filter((t) => t.completed)
        : myTodos;

  const resetForm = () => {
    setFormData({
      title: '',
      category: CATEGORIES[0],
      priority: 3,
      workspaceId: workspaceOptions[0]?.id ?? '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (todo: TodoItem) => {
    setIsAdding(false);
    setEditingId(todo.id);
    setFormData({
      title: todo.title,
      category: todo.category ?? CATEGORIES[0],
      priority: todo.priority ?? 3,
      workspaceId: todo.workspaceId ?? workspaceOptions[0]?.id ?? '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const wsId = workspaces.length > 0 && formData.workspaceId && !formData.workspaceId.startsWith('dummy-')
      ? formData.workspaceId
      : null;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        body: {
          title: formData.title.trim(),
          category: formData.category,
          priority: formData.priority,
          workspaceId: wsId,
        },
      });
    } else {
      createMutation.mutate({
        title: formData.title.trim(),
        category: formData.category,
        priority: formData.priority,
        workspaceId: wsId,
      });
    }
  };

  const getWorkspaceName = (todo: TodoItem) => {
    if (todo.workspace?.name) return todo.workspace.name;
    const ws = workspaces.find((w) => w.id === todo.workspaceId);
    return ws?.name ?? '-';
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sticky top-0 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md z-10 py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:py-0">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-1">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  resetForm();
                }}
                className={`flex-1 sm:flex-none px-4 py-2 sm:py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                  filter === f
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {f === 'all' ? 'งานทั้งหมด' : f === 'active' ? 'กำลังทำ' : 'เสร็จแล้ว'}
              </button>
            ))}
          </div>
          {q && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm">
              <span>ค้นหา: {`"${q}"`}</span>
              <Link
                href="/dashboard/todos"
                className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded"
                aria-label="ล้างการค้นหา"
              >
                <X size={14} />
              </Link>
            </div>
          )}
        </div>
        {!isAdding && !editingId && (
          <Button
            onClick={() => setIsAdding(true)}
            className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus size={18} /> เพิ่มงานใหม่
          </Button>
        )}
      </div>

      <Dialog
        open={isAdding || !!editingId}
        onOpenChange={(open) => !open && resetForm()}
      >
        <DialogContent
          size="md"
          className="p-0 max-h-[90dvh] flex flex-col sm:max-w-lg"
        >
          <div
            className={`absolute left-0 top-0 h-1 w-full rounded-t-2xl ${
              editingId ? 'bg-blue-500' : 'bg-amber-400'
            }`}
          />
          <DialogHeader className="flex-shrink-0 border-b border-slate-100 dark:border-slate-700 px-4 sm:px-6 py-4 sm:py-5">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100">
              {editingId ? (
                <>
                  <Edit size={20} className="text-blue-500" /> แก้ไขงาน
                </>
              ) : (
                <>
                  <Plus size={20} className="text-amber-500" /> สร้างงานใหม่
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
              <Input
                id="todo-title"
                name="title"
                type="text"
                placeholder="คุณต้องทำอะไรบ้าง?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                autoFocus
                className="w-full text-base sm:text-lg font-medium border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="todo-category" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    หมวดหมู่
                  </label>
                  <select
                    id="todo-category"
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="text-sm border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 min-h-[44px]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="todo-workspace" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ทีม / Workspace
                  </label>
                  <select
                    id="todo-workspace"
                    name="workspaceId"
                    value={formData.workspaceId || workspaceOptions[0]?.id}
                    onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                    className="text-sm border-2 border-slate-200 dark:border-slate-600 rounded-xl p-3 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 min-h-[44px]"
                  >
                    {workspaceOptions.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="todo-priority" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ความสำคัญ{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-bold">P{formData.priority}</span>
                  </label>
                  <div className="flex items-center h-[44px] px-2">
                    <input
                      id="todo-priority"
                      name="priority"
                      type="range"
                      min="1"
                      max="5"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: Number(e.target.value) })
                      }
                      className="w-full accent-amber-500 h-2"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-slate-100 dark:border-slate-700 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-b-2xl">
              <Button type="button" variant="outline" onClick={resetForm}>
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className={
                  editingId
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-amber-500 hover:bg-amber-600'
                }
              >
                {editingId ? (
                  <>
                    <Save size={16} className="mr-2" /> บันทึกการแก้ไข
                  </>
                ) : (
                  'เพิ่มงาน'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-600">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">
            ไม่มีงานที่ต้องทำ
          </h3>
          <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
            ยอดเยี่ยมมาก! คุณเคลียร์งานหมดแล้ว หรือกดเพิ่มงานใหม่เพื่อเริ่มต้น
          </p>
          <Button className="mt-4" onClick={() => setIsAdding(true)}>
            <Plus size={18} className="mr-2" /> เพิ่มงานใหม่
          </Button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 pb-20">
          {filtered.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm transition-all duration-200 border ${
                todo.completed
                  ? 'opacity-70 bg-slate-50 dark:bg-slate-800/70 border-transparent'
                  : 'border-transparent hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900'
              } ${editingId === todo.id ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
            >
              <button
                onClick={() =>
                  toggleMutation.mutate({
                    id: todo.id,
                    completed: !todo.completed,
                  })
                }
                className="mt-1 sm:mt-0 flex-shrink-0 transition-transform active:scale-90 p-1"
              >
                {todo.completed ? (
                  <CheckCircle2
                    className="text-green-500 fill-green-50 dark:fill-green-950"
                    size={28}
                  />
                ) : (
                  <Circle
                    className="text-slate-300 hover:text-blue-500"
                    size={28}
                  />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-base sm:text-lg font-semibold truncate transition-all duration-200 ${
                    todo.completed
                      ? 'text-slate-400 line-through decoration-slate-300'
                      : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {todo.title}
                </p>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <span
                    className={`text-[11px] sm:text-xs px-2.5 py-1 rounded-md font-semibold ${
                      todo.category === 'Production'
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900'
                        : todo.category === 'Marketing'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {todo.category ?? 'Admin'}
                  </span>
                  <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                    <Briefcase size={12} /> {getWorkspaceName(todo)}
                  </span>
                  {(todo.priority ?? 0) >= 4 && (
                    <span className="text-[11px] sm:text-xs px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900 font-bold flex items-center gap-1">
                      ⚡ P{todo.priority}
                    </span>
                  )}
                  {user?.role === 'admin' && (
                    <span className="text-[11px] sm:text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                      UID: {todo.userId.slice(0, 8)}
                    </span>
                  )}
                </div>
              </div>
              <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center h-full gap-1">
                <button
                  onClick={() => handleStartEdit(todo)}
                  className="p-2 sm:p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() =>
                    confirm('ลบงานนี้ใช่ไหม?') && deleteMutation.mutate(todo.id)
                  }
                  className="p-2 sm:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isAdding && !editingId && (
        <Button
          onClick={() => setIsAdding(true)}
          className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg shadow-blue-600/40"
        >
          <Plus size={28} />
        </Button>
      )}
    </div>
  );
}
