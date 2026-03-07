import { Elysia } from 'elysia';
import { verifyJWT, type JwtPayload } from './auth';

const AUTH_COOKIE = 'auth_token';

function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE}=([^;]+)`));
  if (match) return match[1];
  return null;
}

export const authPlugin = new Elysia({ name: 'auth' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    const token = getTokenFromRequest(request);
    if (!token) return { user: null as JwtPayload | null };
    const payload = await verifyJWT(token);
    return { user: payload };
  })
  .macro({
    requireAuth: (enforceAdmin?: boolean) => ({
      beforeHandle({ user }) {
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        if (enforceAdmin && user.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Forbidden', code: 'FORBIDDEN' }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      },
    }),
  });

export { AUTH_COOKIE };
