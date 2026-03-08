'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/eden';

const CATEGORIES = ['Production', 'Marketing', 'Admin'];
const DAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

export default function OverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const res = await api.dashboard.overview.get();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
  });

  if (isLoading || !data) {
    return <div className="py-16 text-center text-slate-500">กำลังโหลด...</div>;
  }

  const d = data as {
    totalCompleted?: number;
    completionRate?: number;
    backlog?: number;
    total?: number;
    byCategory?: Record<string, number>;
    trendByDay?: Record<string, number>;
  };
  const totalCompleted = d?.totalCompleted ?? 0;
  const completionRate = d?.completionRate ?? 0;
  const backlog = d?.backlog ?? 0;
  const total = d?.total ?? 0;
  const byCategory = d?.byCategory ?? {};
  const prod = byCategory?.Production ?? 0;
  const mkt = byCategory?.Marketing ?? 0;
  const adm = byCategory?.Admin ?? 0;
  const getPercent = (cat: string) =>
    total === 0 ? 0 : ((byCategory[cat] || 0) / total) * 100;
  const pieGradient = `conic-gradient(#2563eb 0% ${getPercent('Production')}%, #f59e0b ${getPercent('Production')}% ${getPercent('Production') + getPercent('Marketing')}%, #94a3b8 ${getPercent('Production') + getPercent('Marketing')}% 100%)`;

  // Bar chart: last 7 days from trendByDay, or fixed demo values
  const trendByDay = d?.trendByDay ?? {};
  const barHeights = DAYS.map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const key = date.toISOString().slice(0, 10);
    const val = trendByDay[key];
    return typeof val === 'number' ? val : [40, 60, 45, 80, 50, 90, 30][i];
  });
  const maxBar = Math.max(...barHeights, 1);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <span className="text-slate-500 text-xs md:text-sm font-semibold block mb-1">
            งานทั้งหมด
          </span>
          <div className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
            {total}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 border-b-4 border-b-green-500">
          <span className="text-slate-500 text-xs md:text-sm font-semibold block mb-1">
            สำเร็จแล้ว
          </span>
          <div className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
            {totalCompleted}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 border-b-4 border-b-amber-500">
          <span className="text-slate-500 text-xs md:text-sm font-semibold block mb-1">
            ค้างอยู่ (Backlog)
          </span>
          <div className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
            {backlog}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 md:p-6 rounded-2xl shadow-md shadow-blue-600/20 text-white col-span-2 md:col-span-1">
          <span className="text-blue-100 text-xs md:text-sm font-semibold block mb-1">
            อัตราความสำเร็จ
          </span>
          <div className="text-3xl md:text-4xl font-bold">{completionRate}%</div>
          <div className="w-full bg-blue-900/50 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 w-full text-left">
            สัดส่วนตามประเภทงาน
          </h3>
          <div
            className="relative w-48 h-48 md:w-56 md:h-56 rounded-full mb-8 shadow-inner"
            style={{ background: pieGradient }}
          >
            <div className="absolute inset-4 md:inset-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  {total}
                </div>
                <div className="text-xs text-slate-400 font-semibold uppercase">
                  Total
                </div>
              </div>
            </div>
          </div>
          <div className="w-full space-y-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl"
              >
                <span className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      cat === 'Production'
                        ? 'bg-blue-600'
                        : cat === 'Marketing'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                    }`}
                  />
                  {cat}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {byCategory[cat] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-8">
            แนวโน้ม (สัปดาห์นี้)
          </h3>
          <div className="h-64 flex items-end justify-between gap-1 sm:gap-4 pb-8 border-b border-slate-100 dark:border-slate-700 relative mt-4">
            <div className="absolute left-0 bottom-8 w-full h-[calc(100%-2rem)] flex flex-col justify-between text-xs text-slate-300 pointer-events-none z-0">
              <div className="border-t border-slate-100 dark:border-slate-700 w-full h-0" />
              <div className="border-t border-slate-100 dark:border-slate-700 w-full h-0" />
              <div className="border-t border-slate-100 dark:border-slate-700 w-full h-0" />
            </div>
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="w-full flex flex-col items-center gap-3 relative z-10 group h-full justify-end"
              >
                <div className="w-full max-w-[48px] bg-blue-50 dark:bg-blue-950/50 rounded-t-lg relative h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-500 group-hover:from-blue-700 group-hover:to-blue-500 shadow-sm"
                    style={{ height: `${(h / maxBar) * 100}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded font-bold transition-opacity">
                      {h}
                    </div>
                  </div>
                </div>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">
                  {DAYS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
