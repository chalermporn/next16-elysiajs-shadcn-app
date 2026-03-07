'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CheckCircle2,
  LayoutDashboard,
  Users,
  Activity,
  ListTodo,
  LogOut,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
}: {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
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
          'fixed inset-y-0 left-0 z-50 w-[280px] bg-[#0f172a] text-slate-300 shadow-2xl',
          'flex flex-col border-r border-slate-800',
          'transform transition-all duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'md:relative'
        )}
      >
        <div className="px-6 py-8 flex items-center justify-between">
          <Link href="/dashboard/todos" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <CheckCircle2 className="text-white" size={20} />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Todo<span className="text-amber-400">Flow</span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            <X size={20} />
          </Button>
        </div>

        <div className="px-4 mb-8">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900 border border-slate-700/50 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center font-bold text-white">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user.name || user.email}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      user.role === 'admin'
                        ? 'bg-amber-400'
                        : 'bg-blue-400'
                    )}
                  />
                  <p className="text-[11px] font-medium text-slate-400 uppercase">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
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
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
                {isActive && (
                  <div className="ml-auto w-1.5 h-6 bg-blue-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800/80">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:bg-red-500/10 hover:text-red-400"
            onClick={logout}
          >
            <LogOut size={20} className="mr-3" />
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
      className="md:hidden -ml-2 text-slate-600"
      onClick={onClick}
    >
      <Menu size={24} />
    </Button>
  );
}
