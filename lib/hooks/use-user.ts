'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/eden';

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function useUser() {
  const { data, isLoading, error } = useQuery<User | null>({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const res = await api.users.me.get();
      if (res.error) throw new Error((res.error as { error?: string })?.error || 'Request failed');
      return (res.data as unknown) as User | null;
    },
    retry: false,
  });
  return { user: data, isLoading, error };
}
