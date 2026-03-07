import '@testing-library/jest-dom/vitest';

process.env.JWT_SECRET =
  'test-secret-for-vitest-must-be-at-least-32-characters-long-for-hs256';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/app';
