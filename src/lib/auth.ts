import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'proctorguard-super-secret-jwt-key-2026-high-integrity';

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
  institution?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check cookie if present
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    if (cookies.token) {
      return cookies.token;
    }
  }

  return null;
}

export async function getSession(req: Request): Promise<TokenPayload | null> {
  const token = extractBearerToken(req);
  if (!token) return null;
  return verifyToken(token);
}
