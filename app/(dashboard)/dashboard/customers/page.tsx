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

  const segments = (data as { segments?: Array<{ userId: string; name?: string; email: string; segment: string; frequency: number; impact: number; recency?: string }> } | undefined)?.segments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl w-fit">
          <Target size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            RFM Customer Segment
          </h2>
          <p className="text-slate-500 mt-1">
            วิเคราะห์พฤติกรรมการมีส่วนร่วมของทีม
          </p>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {segments?.map((s: { userId: string; name?: string; email: string; segment: string; frequency: number; impact: number; recency?: string }) => (
          <div
            key={s.userId}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-slate-800">{s.name || s.email}</h3>
                <p className="text-xs text-slate-400">{s.email}</p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                  s.segment === 'Power User'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : s.segment === 'At Risk'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {s.segment}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">
                  ความถี่
                </p>
                <p className="font-bold text-slate-800">{s.frequency}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Impact</p>
                <p className="font-bold text-amber-600">{s.impact} pts</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="p-5 text-sm font-semibold text-slate-600">
                ผู้ใช้
              </th>
              <th className="p-5 text-sm font-semibold text-slate-600">
                Recency
              </th>
              <th className="p-5 text-sm font-semibold text-slate-600">
                ความถี่
              </th>
              <th className="p-5 text-sm font-semibold text-slate-600">
                Impact
              </th>
              <th className="p-5 text-sm font-semibold text-slate-600">
                Segment
              </th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s: { userId: string; name?: string; email: string; segment: string; frequency: number; impact: number; recency?: string }) => (
              <tr
                key={s.userId}
                className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
              >
                <td className="p-5">
                  <div className="font-bold text-slate-800">{s.name || s.email}</div>
                  <div className="text-xs text-slate-400">{s.email}</div>
                </td>
                <td className="p-5 text-sm text-slate-600">
                  {s.recency
                    ? new Date(s.recency).toLocaleDateString('th-TH')
                    : '-'}
                </td>
                <td className="p-5 font-bold">{s.frequency}</td>
                <td className="p-5 font-bold text-amber-600">{s.impact}</td>
                <td className="p-5">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      s.segment === 'Power User'
                        ? 'bg-green-50 text-green-700'
                        : s.segment === 'At Risk'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {s.segment}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
