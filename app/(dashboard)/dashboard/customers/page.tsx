'use client';

import { useQuery } from '@tanstack/react-query';
import { Target } from 'lucide-react';
import { api } from '@/lib/eden';

export default function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'customers'],
    queryFn: async () => {
      const res = await api.dashboard.customers.get();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Failed');
      return res.data;
    },
  });

  if (isLoading || !data) {
    return <div className="py-16 text-center text-slate-500">กำลังโหลด...</div>;
  }

  const segments = (data as { segments?: Array<{ userId: string; name?: string; email: string; segment: string; frequency: number; impact: number; total?: number }> } | undefined)?.segments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 md:mb-8 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="p-4 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl w-fit">
          <Target size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            RFM Customer Segment
          </h2>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {segments?.map((s) => (
          <div
            key={s.userId}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                  {(s.name || s.email).charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{s.name || s.email}</h3>
                  <p className="text-xs text-slate-400">{s.email}</p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  s.segment === 'Power User'
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:border-green-800'
                    : s.segment === 'At Risk' || s.segment === 'At Risk (ดองงาน)'
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                      : s.segment === 'Active'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:border-slate-600'
                }`}
              >
                {s.segment}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">งานที่ทำสำเร็จ</p>
                <p className="font-bold text-slate-800 dark:text-slate-100">{s.frequency} / {s.total ?? 1}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">คะแนน (Impact)</p>
                <p className="font-bold text-amber-600">{s.impact} pts</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
              <th className="p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">พนักงาน</th>
              <th className="p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">ความถี่ (Freq)</th>
              <th className="p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">คะแนน (Impact)</th>
              <th className="p-5 text-sm font-semibold text-slate-600 dark:text-slate-300">Segment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {segments.map((s: { userId: string; name?: string; email: string; segment: string; frequency: number; impact: number; total?: number }) => {
              const total = s.total ?? 1;
              const pct = total > 0 ? (s.frequency / total) * 100 : 0;
              return (
                <tr key={s.userId} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">
                        {(s.name || s.email).charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{s.name || s.email}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {s.frequency}/{total}
                      </span>
                    </div>
                  </td>
                  <td className="p-5 font-bold text-amber-600 text-lg">{s.impact}</td>
                  <td className="p-5">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                        s.segment === 'Power User'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:border-green-800'
                          : s.segment === 'At Risk' || s.segment === 'At Risk (ดองงาน)'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:border-red-800'
                            : s.segment === 'Active'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:border-blue-800'
                              : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:border-slate-600'
                      }`}
                    >
                      {s.segment}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
