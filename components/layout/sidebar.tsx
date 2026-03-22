'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  LayoutDashboard,
  Users,
  Activity,
  ListTodo,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUser } from '@/lib/hooks/use-user';
import { api } from '@/lib/eden';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'จัดการงาน (Todos)', path: '/dashboard/todos', icon: ListTodo, roles: ['admin', 'user'] as const },
  { name: 'ภาพรวมระบบ (Overview)', path: '/dashboard/overview', icon: LayoutDashboard, roles: ['admin'] as const },
  { name: 'พฤติกรรมผู้ใช้ (RFM)', path: '/dashboard/customers', icon: Activity, roles: ['admin'] as const },
  { name: 'ประสิทธิภาพทีม (Branch)', path: '/dashboard/branches', icon: TrendingUp, roles: ['admin'] as const },
  { name: 'จัดการผู้ใช้ (Users)', path: '/admin/users', icon: Users, roles: ['admin'] as const },
];

export function Sidebar({
  isOpen,
  setIsOpen,
  onProfileClick,
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  onProfileClick?: () => void;
}) {
  const pathname = usePathname();
  const { user } = useUser();

  async function logout() {
    await api.auth.logout.post();
    window.location.href = '/login';
  }

  if (!user) return null;

  const allowedItems = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(user.role)
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] bg-[oklch(0.19_0.055_262)] text-slate-300 shadow-2xl',
          'flex flex-col border-r border-white/10',
          'transform transition-all duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'md:relative'
        )}
      >
        <div className="px-6 py-8 flex items-center justify-between">
          <Link
            href="/dashboard/todos"
            className="flex items-center gap-3 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.19_0.055_262)]"
          >
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/35 ring-1 ring-white/10">
              <CheckCircle2 className="text-white" size={20} aria-hidden />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Todo<span className="text-sky-300">Flow</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-400 hover:text-white min-h-11 min-w-11 cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-label="ปิดเมนู"
          >
            <X size={20} aria-hidden />
          </Button>
        </div>

        <div className="px-4 mb-8">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onProfileClick?.();
            }}
            className="w-full text-left p-4 rounded-2xl bg-linear-to-br from-white/8 to-white/3 border border-white/10 relative overflow-hidden hover:border-sky-500/30 hover:bg-white/5 transition-colors duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-10 shrink-0 border-2 border-slate-600">
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name ?? user.email} />
                ) : null}
                <AvatarFallback className="bg-slate-700 text-white font-bold">
                  {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user.name || user.email}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      user.role === 'admin' ? 'bg-sky-400' : 'bg-emerald-400'
                    )}
                    aria-hidden
                  />
                  <p className="text-[11px] font-medium text-slate-400 uppercase">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase">
          Menu
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 min-h-11 rounded-xl transition-colors duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50',
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 font-semibold ring-1 ring-sky-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1 h-7 bg-sky-400 rounded-full shrink-0" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 min-h-11 text-slate-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer transition-colors duration-200"
            onClick={logout}
          >
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </>
  );
}

export function SidebarToggle({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden -ml-2 min-h-11 min-w-11 text-muted-foreground hover:text-foreground cursor-pointer"
      onClick={onClick}
      aria-label="เปิดเมนู"
    >
      <Menu size={24} aria-hidden />
    </Button>
  );
}
