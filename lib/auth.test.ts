/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createJWT,
  verifyJWT,
} from './auth';

describe('auth', () => {

  describe('hashPassword', () => {
    it('hashes a password', async () => {
      const hash = await hashPassword('password123');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe('password123');
    });

    it('produces different hashes for same password', async () => {
      const h1 = await hashPassword('same');
      const h2 = await hashPassword('same');
      expect(h1).not.toBe(h2);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const hash = await hashPassword('correct');
      const ok = await verifyPassword('correct', hash);
      expect(ok).toBe(true);
    });

    it('returns false for wrong password', async () => {
      const hash = await hashPassword('correct');
      const ok = await verifyPassword('wrong', hash);
      expect(ok).toBe(false);
    });
  });

  describe('createJWT and verifyJWT', () => {
    it('creates and verifies JWT', async () => {
      const token = await createJWT('user-123', 'admin');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const payload = await verifyJWT(token);
      expect(payload).not.toBeNull();
      expect(payload!.sub).toBe('user-123');
      expect(payload!.role).toBe('admin');
      expect(payload!.iat).toBeDefined();
      expect(payload!.exp).toBeDefined();
    });

    it('returns null for invalid token', async () => {
      const payload = await verifyJWT('invalid-token');
      expect(payload).toBeNull();
    });

    it('returns null for token with missing sub', async () => {
      const { SignJWT } = await import('jose');
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
      const payload = await verifyJWT(token);
      expect(payload).toBeNull();
    });

    it('returns null for token with non-string role', async () => {
      const { SignJWT } = await import('jose');
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');
      const token = await new SignJWT({ role: 123 })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject('user-1')
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
      const payload = await verifyJWT(token);
      expect(payload).toBeNull();
    });

    it('creates JWT for user role', async () => {
      const token = await createJWT('user-456', 'user');
      const payload = await verifyJWT(token);
      expect(payload!.role).toBe('user');
    });
  });
});
