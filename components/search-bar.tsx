'use client';

import { useState, useCallback, useEffect, useId } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchBar() {
  const id = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get('q') ?? '';
  const [value, setValue] = useState(qFromUrl);

  useEffect(() => {
    setValue(qFromUrl);
  }, [qFromUrl]);

  const handleSearch = useCallback(() => {
    const trimmed = value.trim();
    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    const query = params.toString();
    const url = pathname.startsWith('/dashboard/todos')
      ? `${pathname}${query ? `?${query}` : ''}`
      : `/dashboard/todos${query ? `?${query}` : ''}`;
    router.push(url);
  }, [value, pathname, searchParams, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-sm w-28 sm:w-48 lg:w-64 min-w-0">
      <Search size={16} className="text-slate-400 shrink-0 mr-2" />
      <input
        id={`search-query-${id}`}
        name="q"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ค้นหางาน (ชื่อ, รายละเอียด)..."
        className="bg-transparent text-sm outline-none w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        aria-label="ค้นหางาน"
      />
    </div>
  );
}
