'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarToggle } from '@/components/layout/sidebar';
import { useUser } from '@/lib/hooks/use-user';

const titles: Record<string, string> = {
  '/dashboard/todos': 'จัดการงานของคุณ',
  '/dashboard/overview': 'ภาพรวมระบบทั้งหมด',
  '/dashboard/customers': 'วิเคราะห์พฤติกรรมผู้ใช้ (RFM)',
  '/dashboard/branches': 'ประสิทธิภาพแต่ละทีม (Workspaces)',
  '/admin/users': 'จัดการบัญชีผู้ใช้',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useUser();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <SidebarToggle onClick={() => setSidebarOpen(true)} />
            <h1 className="text-lg font-bold text-slate-800">
              {titles[pathname] || 'TodoFlow'}
            </h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </div>
        </header>
        <header className="hidden md:flex bg-white/50 backdrop-blur-sm border-b border-slate-200/60 px-8 py-5 items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {titles[pathname] || 'Dashboard'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              ยินดีต้อนรับกลับมา, {user.name?.split(' ')[0] || user.email.split('@')[0]} 👋
            </p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
