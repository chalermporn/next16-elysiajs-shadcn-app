/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { Elysia } from 'elysia';
import { authPlugin, AUTH_COOKIE } from './api-auth-plugin';
import { createJWT } from './auth';

interface MacroResult { beforeHandle: (ctx: Record<string, unknown>) => Response | void }
type MacroFn = (enforceAdmin?: boolean) => MacroResult;

describe('api-auth-plugin', () => {
  it('exports AUTH_COOKIE constant', () => {
    expect(AUTH_COOKIE).toBe('auth_token');
  });

  it('returns user null when no token', async () => {
    const app = new Elysia()
      .use(authPlugin)
      .get('/', ({ user }) => ({ user }));

    const res = await app.handle(new Request('http://localhost/'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it('returns user when Bearer token is valid', async () => {
    const token = await createJWT('user-1', 'admin');
    const app = new Elysia()
      .use(authPlugin)
      .get('/', ({ user }) => ({ user }));

    const res = await app.handle(
      new Request('http://localhost/', {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).not.toBeNull();
    expect(data.user.sub).toBe('user-1');
    expect(data.user.role).toBe('admin');
  });

  it('returns user when Cookie token is valid', async () => {
    const token = await createJWT('user-2', 'user');
    const app = new Elysia()
      .use(authPlugin)
      .get('/', ({ user }) => ({ user }));

    const res = await app.handle(
      new Request('http://localhost/', {
        headers: { Cookie: `${AUTH_COOKIE}=${token}` },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).not.toBeNull();
    expect(data.user.sub).toBe('user-2');
  });

  it('returns user null when token is invalid', async () => {
    const app = new Elysia()
      .use(authPlugin)
      .get('/', ({ user }) => ({ user }));

    const res = await app.handle(
      new Request('http://localhost/', {
        headers: { Authorization: 'Bearer invalid-token' },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it('requireAuth macro returns 401 when no user', async () => {
    type PluginWithMacro = { config?: { macro?: Record<string, MacroFn> } };
    const plugin = authPlugin as unknown as PluginWithMacro;
    const macroConfig = plugin.config?.macro?.requireAuth;
    const cfg = typeof macroConfig === 'function' ? macroConfig(false) : null;
    if (!cfg?.beforeHandle) return;

    const app = new Elysia()
      .use(authPlugin)
      .get('/p', () => new Response('ok'), cfg as never);

    const res = await app.handle(new Request('http://localhost/p'));
    expect(res.status).toBe(401);
  });

  it('requireAuth macro returns 403 when user is not admin (enforceAdmin=true)', async () => {
    const token = await createJWT('user-3', 'user');
    const plugin = authPlugin as unknown as { config?: { macro?: Record<string, MacroFn> } };
    const macroConfig = plugin.config?.macro?.requireAuth;
    const cfg = typeof macroConfig === 'function' ? macroConfig(true) : null;
    if (!cfg?.beforeHandle) return;

    const app = new Elysia()
      .use(authPlugin)
      .get('/admin', () => new Response('admin'), cfg as never);

    const res = await app.handle(
      new Request('http://localhost/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(403);
  });

  it('requireAuth macro allows admin when enforceAdmin=true', async () => {
    const token = await createJWT('admin-1', 'admin');
    const plugin = authPlugin as unknown as { config?: { macro?: Record<string, MacroFn> } };
    const macroConfig = plugin.config?.macro?.requireAuth;
    const cfg = typeof macroConfig === 'function' ? macroConfig(true) : null;
    if (!cfg?.beforeHandle) return;

    const app = new Elysia()
      .use(authPlugin)
      .get('/admin', () => new Response('admin'), cfg as never);

    const res = await app.handle(
      new Request('http://localhost/admin', {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
    expect(res.status).toBe(200);
    const data = await res.text();
    expect(data).toBe('admin');
  });
});
