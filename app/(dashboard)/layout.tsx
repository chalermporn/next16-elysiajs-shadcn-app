'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Sparkles } from 'lucide-react';
import { SearchBar } from '@/components/search-bar';
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
        <div className="animate-pulse text-muted-foreground text-base">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-linear-to-br from-background via-background to-primary/4 dark:from-background dark:via-background dark:to-primary/6 font-sans text-foreground overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onProfileClick={() => setProfileOpen(true)} />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} user={user} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="md:hidden bg-background/80 dark:bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between gap-2 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <SidebarToggle onClick={() => setSidebarOpen(true)} />
            <h1 className="text-lg font-bold text-foreground truncate">
              {titles[pathname] || 'TodoFlow'}
            </h1>
          </div>
          <div className="lg:hidden shrink-0">
            <SearchBar />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-foreground/70" />
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="เปิดโปรไฟล์"
              className="flex items-center justify-center rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all duration-200 cursor-pointer min-h-11 min-w-11"
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
        <header className="hidden md:flex bg-card/70 backdrop-blur-md border-b border-border px-8 py-5 items-center justify-between sticky top-0 z-10 transition-colors duration-200">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {titles[pathname] || 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
              <span>
                ยินดีต้อนรับกลับมา, {user.name?.split(' ')[0] || user.email.split('@')[0]}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center">
              <SearchBar />
            </div>
            <button
              type="button"
              aria-label="การแจ้งเตือน"
              className="min-h-11 min-w-11 p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors duration-200 relative cursor-pointer"
            >
              <Bell size={20} className="mx-auto" aria-hidden />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
            </button>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              aria-label="เปิดโปรไฟล์"
              className="min-h-11 min-w-11 flex items-center justify-center rounded-full overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all duration-200 cursor-pointer"
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
