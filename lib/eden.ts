import { treaty } from '@elysiajs/eden';
import type { App } from '@/app/api/[[...slugs]]/route';

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && typeof location !== 'undefined') {
    return location.origin;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
}

export const api = treaty<App>(getBaseUrl()).api;
