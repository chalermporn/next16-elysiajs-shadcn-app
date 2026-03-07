export const USER_ROLE = ['admin', 'user'] as const;
export type UserRole = (typeof USER_ROLE)[number];

export const JWT_EXPIRY = '7d';

export const CATEGORIES = ['Production', 'Marketing', 'Admin'] as const;
export type TodoCategory = (typeof CATEGORIES)[number];
