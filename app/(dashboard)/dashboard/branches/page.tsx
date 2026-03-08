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
  const rawPerformance = dashboardData?.performance ?? [];
  const performance = [...rawPerformance].sort((a, b) => b.total - a.total);
  const heatmapData = dashboardData?.heatmap ?? {};

  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์'];
  const times = ['เช้า', 'บ่าย', 'เย็น', 'ดึก'];

  // Map API heatmap keys (getDay()-getHours()) to grid [dayIdx][timeIdx]
  // getDay: 0=Sun, 1=Mon..5=Fri, 6=Sat. We use Mon-Fri (1-5) -> dayIdx 0-4
  // Hours: เช้า 6-11, บ่าย 12-17, เย็น 18-21, ดึก 22-23,0-5
  const getTimeIdx = (hour: number) => {
    if (hour >= 6 && hour <= 11) return 0;
    if (hour >= 12 && hour <= 17) return 1;
    if (hour >= 18 && hour <= 21) return 2;
    return 3;
  };
  const gridValues: number[][] = days.map(() => [0, 0, 0, 0]);
  Object.entries(heatmapData).forEach(([key, count]) => {
    const [day, hour] = key.split('-').map(Number);
    if (day >= 1 && day <= 5) {
      const dayIdx = day - 1;
      const timeIdx = getTimeIdx(hour);
      gridValues[dayIdx][timeIdx] += count;
    }
  });
  const maxVal = Math.max(1, ...gridValues.flat());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl w-fit">
          <Briefcase size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Branch Performance
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            ประสิทธิภาพแต่ละทีม (Workspaces)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            ปริมาณงานแยกตามแผนก
          </h3>
          <div className="space-y-5">
            {performance.map((p: { workspaceId: string; name: string; total: number; completed: number }, i: number) => (
              <div key={p.workspaceId} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-400 dark:text-slate-500 text-sm border border-slate-100 dark:border-slate-600">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{p.name}</span>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                      {p.completed} / {p.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
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
            {performance.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">ยังไม่มี Workspace หรืองานในระบบ</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-amber-500" />
            ช่วงเวลาทำงาน (Heatmap)
          </h3>
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-600 flex-1 overflow-x-auto">
            <div className="min-w-[300px]">
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="col-span-1" />
                {times.map((t) => (
                  <div
                    key={t}
                    className="text-xs font-bold text-slate-400 dark:text-slate-500 text-center uppercase tracking-wider"
                  >
                    {t}
                  </div>
                ))}
              </div>
              {days.map((day, dayIdx) => (
                <div
                  key={day}
                  className="grid grid-cols-5 gap-2 mb-2 items-center"
                >
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 col-span-1">
                  {day}
                </div>
                {times.map((time, timeIdx) => {
                  const val = gridValues[dayIdx][timeIdx];
                  const intensity = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
                  const color =
                    intensity > 70
                      ? 'bg-blue-600 text-white'
                      : intensity > 40
                        ? 'bg-blue-400 text-white'
                        : intensity > 15
                          ? 'bg-blue-200 text-slate-600'
                          : 'bg-blue-100/80 dark:bg-blue-950/50 text-muted-foreground';
                  return (
                    <div
                      key={time}
                      className={`h-10 rounded-xl col-span-1 flex items-center justify-center text-xs font-bold ${color}`}
                      title={`${time}: ${val} งาน`}
                    >
                      {val > 0 ? val : ''}
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
