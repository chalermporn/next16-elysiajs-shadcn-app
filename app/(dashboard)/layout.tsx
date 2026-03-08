'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { Sidebar, SidebarToggle } from '@/components/layout/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProfileModal } from '@/components/profile-modal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, isLoading } = useUser();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-100 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onProfileClick={() => setProfileOpen(true)} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} user={user} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-background/80 dark:bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <SidebarToggle onClick={() => setSidebarOpen(true)} />
            <h1 className="text-lg font-bold text-foreground">
              {titles[pathname] || 'TodoFlow'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-foreground/70" />
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center justify-center rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all"
            >
              <Avatar className="size-8">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name ?? user.email} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </div>
        </header>
        <header className="hidden md:flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-700/60 px-8 py-5 items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {titles[pathname] || 'Dashboard'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              ยินดีต้อนรับกลับมา, {user.name?.split(' ')[0] || user.email.split('@')[0]} 👋
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full px-4 py-2 shadow-sm">
              <Search size={16} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="ค้นหา..."
                className="bg-transparent text-sm outline-none w-48 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
            </button>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="flex items-center justify-center rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all"
            >
              <Avatar className="size-9">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name ?? user.email} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
