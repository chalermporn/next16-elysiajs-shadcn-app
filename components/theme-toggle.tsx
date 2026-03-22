'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const themes = [
  { value: 'light', label: 'สว่าง', icon: Sun },
  { value: 'dark', label: 'มืด', icon: Moon },
  { value: 'system', label: 'ตามระบบ', icon: Monitor },
] as const;

type ThemeValue = 'light' | 'dark' | 'system';

export function ThemeToggle({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  const currentValue = (theme as ThemeValue) || 'system';
  const TriggerIcon = mounted
    ? (themes.find((t) => t.value === currentValue)?.icon ?? Monitor)
    : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-all',
          'text-muted-foreground hover:bg-accent/80 hover:text-foreground',
          'outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        aria-label="สลับโหมดสี (สว่าง/มืด/ตามระบบ)"
      >
        <TriggerIcon className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuRadioGroup
          value={currentValue}
          onValueChange={(v) => setTheme(v as ThemeValue)}
        >
          {themes.map(({ value, label, icon: TIcon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <TIcon className="mr-2.5 h-4 w-4 text-muted-foreground" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
