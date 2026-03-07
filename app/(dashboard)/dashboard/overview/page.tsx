'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/eden';

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

  const d = data as { totalCompleted?: number; completionRate?: number; backlog?: number; total?: number; byCategory?: Record<string, number> } | undefined;
  const totalCompleted = d?.totalCompleted ?? 0;
  const completionRate = d?.completionRate ?? 0;
  const backlog = d?.backlog ?? 0;
  const total = d?.total ?? 0;
  const byCategory = d?.byCategory ?? {};
  const prod = byCategory?.Production ?? 0;
  const mkt = byCategory?.Marketing ?? 0;
  const adm = byCategory?.Admin ?? 0;
  const other = (total || 0) - prod - mkt - adm;
  const getPercent = (n: number) =>
    total === 0 ? 0 : Math.round((n / total) * 100);
  const pieStyle = {
    background: `conic-gradient(
      #2563eb 0% ${getPercent(prod)}%,
      #f59e0b ${getPercent(prod)}% ${getPercent(prod) + getPercent(mkt)}%,
      #94a3b8 ${getPercent(prod) + getPercent(mkt)}% ${getPercent(prod) + getPercent(mkt) + getPercent(adm)}%,
      #64748b ${getPercent(prod) + getPercent(mkt) + getPercent(adm)}% 100%
    )`,
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <span className="text-slate-500 text-xs md:text-sm font-semibold block mb-1">
            งานทั้งหมด
          </span>
          <div className="text-2xl md:text-4xl font-bold text-slate-800">
            {total} <span className="text-sm font-medium text-slate-400">งาน</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-green-500">
          <span className="text-slate-500 text-xs md:text-sm font-semibold block mb-1">
            สำเร็จแล้ว
          </span>
          <div className="text-2xl md:text-4xl font-bold text-slate-800">
            {totalCompleted}
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 border-b-4 border-b-amber-500">
          <span className="text-slate-500 text-xs md:text-sm font-semibold block mb-1">
            ค้างอยู่
          </span>
          <div className="text-2xl md:text-4xl font-bold text-slate-800">
            {backlog}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 md:p-6 rounded-2xl shadow-md text-white col-span-2 md:col-span-1">
          <span className="text-blue-100 text-xs md:text-sm font-semibold block mb-1">
            อัตราความสำเร็จ
          </span>
          <div className="text-3xl md:text-4xl font-bold">{completionRate}%</div>
          <div className="w-full bg-blue-900/50 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">
          สัดส่วนตามประเภทงาน
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div
            className="w-48 h-48 rounded-full flex-shrink-0"
            style={pieStyle}
          />
          <div className="flex-1 w-full space-y-3">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
              <span className="flex items-center gap-3 font-semibold text-slate-700">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                Production
              </span>
              <span className="font-bold">{prod}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
              <span className="flex items-center gap-3 font-semibold text-slate-700">
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                Marketing
              </span>
              <span className="font-bold">{mkt}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
              <span className="flex items-center gap-3 font-semibold text-slate-700">
                <div className="w-3 h-3 bg-slate-400 rounded-full" />
                Admin
              </span>
              <span className="font-bold">{adm}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
