import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcrypt';
import { JWT_EXPIRY } from './constants';
import type { UserRole } from './constants';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);

export type JwtPayload = {
  sub: string;
  role: UserRole;
  iat: number;
  exp: number;
};

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createJWT(userId: string, role: UserRole): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.role !== 'string') return null;
    return {
      sub: payload.sub,
      role: payload.role as UserRole,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}
