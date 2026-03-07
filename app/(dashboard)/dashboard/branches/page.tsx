'use client';

import { useQuery } from '@tanstack/react-query';
import { Briefcase, TrendingUp, Clock } from 'lucide-react';
import { api } from '@/lib/eden';

export default function BranchesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'branches'],
    queryFn: async () => {
      const res = await api.dashboard.branches.get();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
  });

  if (isLoading || !data) {
    return <div className="py-16 text-center text-slate-500">กำลังโหลด...</div>;
  }

  const dashboardData = data as { performance?: Array<{ workspaceId: string; name: string; total: number; completed: number }>; heatmap?: Record<string, number> } | undefined;
  const performance = dashboardData?.performance ?? [];
  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์'];
  const times = ['เช้า', 'บ่าย', 'เย็น', 'ดึก'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit">
          <Briefcase size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Branch Performance
          </h2>
          <p className="text-slate-500 mt-1">
            ประสิทธิภาพตาม Workspace
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            ปริมาณงานแยกตามแผนก
          </h3>
          <div className="space-y-5">
            {(performance ?? []).map((p: { workspaceId: string; name: string; total: number; completed: number }, i: number) => (
              <div key={p.workspaceId} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700">{p.name}</span>
                    <span className="text-sm font-bold text-slate-600">
                      {p.completed} <span className="font-normal text-slate-400">/ {p.total}</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all"
                      style={{
                        width: `${
                          p.total === 0 ? 0 : (p.completed / p.total) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!performance || performance.length === 0) && (
              <p className="text-slate-500 text-sm">ยังไม่มี Workspace</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            ช่วงเวลาทำงาน (Heatmap)
          </h3>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="grid grid-cols-5 gap-2 mb-2">
              <div className="col-span-1" />
              {times.map((t) => (
                <div
                  key={t}
                  className="text-xs font-bold text-slate-400 text-center uppercase"
                >
                  {t}
                </div>
              ))}
            </div>
            {days.map((day) => (
              <div
                key={day}
                className="grid grid-cols-5 gap-2 mb-2 items-center"
              >
                <div className="text-sm font-semibold text-slate-600">
                  {day}
                </div>
                {times.map((time) => {
                  const intensity = Math.floor(Math.random() * 90) + 10;
                  const color =
                    intensity > 80
                      ? 'bg-blue-600 text-white'
                      : intensity > 50
                        ? 'bg-blue-400 text-white'
                        : intensity > 25
                          ? 'bg-blue-200 text-slate-600'
                          : 'bg-blue-100';
                  return (
                    <div
                      key={time}
                      className={`h-10 rounded-xl flex items-center justify-center text-xs font-bold ${color}`}
                    >
                      {intensity > 50 ? intensity : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
