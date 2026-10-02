import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'node:crypto';
export const sessionCookie = 'flowka_admin';
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return new TextEncoder().encode(value);
}
function credentialVersion() {
  return createHash('sha256')
    .update((process.env.ADMIN_EMAIL || '') + ':' + (process.env.ADMIN_PASSWORD_HASH || ''))
    .digest('hex');
}
export async function signSession() {
  return new SignJWT({ role: 'admin', version: credentialVersion() })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(process.env.ADMIN_EMAIL!)
    .setIssuer('flowka')
    .setAudience('flowka-admin')
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret());
}
export async function isAdmin() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ['HS256'],
      issuer: 'flowka',
      audience: 'flowka-admin',
    });
    return (
      payload.role === 'admin' &&
      payload.sub === process.env.ADMIN_EMAIL &&
      payload.version === credentialVersion()
    );
  } catch {
    return false;
  }
}
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 8 * 60 * 60,
};
