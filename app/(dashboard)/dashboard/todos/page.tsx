'use client';

import { useState } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/eden';
import { useUser } from '@/lib/hooks/use-user';
import { toast } from 'sonner';

const CATEGORIES = ['Production', 'Marketing', 'Admin'];

export default function TodosPage() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  const { data, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await api.todos.get();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (body: { title: string; category?: string }) => {
      const res = await api.todos.post(body);
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setTitle('');
      setIsAdding(false);
      toast.success('เพิ่มงานแล้ว');
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

  const items = ((data as { items?: Array<{ id: string; title: string; completed: boolean; category?: string }> } | undefined)?.items ?? []);
  const filtered =
    filter === 'active'
      ? items.filter((t: { completed: boolean }) => !t.completed)
      : filter === 'completed'
        ? items.filter((t: { completed: boolean }) => t.completed)
        : items;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ title: title.trim(), category });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full sm:w-auto">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                filter === f
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f === 'all' ? 'งานทั้งหมด' : f === 'active' ? 'กำลังทำ' : 'เสร็จแล้ว'}
            </button>
          ))}
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          className="hidden md:flex"
        >
          <Plus size={18} className="mr-2" />
          เพิ่มงานใหม่
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-100 mb-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <Input
              placeholder="คุณต้องทำอะไรบ้าง?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-lg border-0 border-b-2 border-slate-100 focus:border-blue-500 rounded-none"
            />
            <div className="flex flex-wrap gap-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-sm border-2 border-slate-100 rounded-xl p-2.5 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  บันทึกงาน
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-slate-500">กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">ไม่มีงานที่ต้องทำ</h3>
          <p className="text-slate-500 text-sm mt-2">
            กดเพิ่มงานใหม่เพื่อเริ่มต้น
          </p>
          <Button className="mt-4" onClick={() => setIsAdding(true)}>
            <Plus size={18} className="mr-2" />
            เพิ่มงาน
          </Button>
        </div>
      ) : (
        <div className="space-y-3 pb-20">
          {filtered.map((todo) => (
            <div
              key={todo.id}
              className={`group flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border transition-all ${
                todo.completed ? 'opacity-70 bg-slate-50' : 'hover:shadow-md'
              }`}
            >
              <button
                onClick={() =>
                  toggleMutation.mutate({ id: todo.id, completed: !todo.completed })
                }
                className="flex-shrink-0"
              >
                {todo.completed ? (
                  <CheckCircle2 className="text-green-500 fill-green-50" size={28} />
                ) : (
                  <Circle className="text-slate-300 hover:text-blue-500" size={28} />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${
                    todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                  }`}
                >
                  {todo.title}
                </p>
                {todo.category && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold ${
                      todo.category === 'Production'
                        ? 'bg-blue-50 text-blue-700'
                        : todo.category === 'Marketing'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {todo.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => deleteMutation.mutate(todo.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={() => setIsAdding(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg"
      >
        <Plus size={28} />
      </Button>
    </div>
  );
}
