import 'server-only';
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { db } from './db';
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.APP_URL || request.url).origin;
  return !!origin && origin === expected;
}
export async function readJson(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new Error('Invalid content type');
  if (Number(request.headers.get('content-length') || 0) > 32768)
    throw new Error('Request too large');
  const text = await request.text();
  if (text.length > 32768) throw new Error('Request too large');
  return JSON.parse(text) as unknown;
}
export async function rateLimit(request: Request, scope: string, limit: number, minutes: number) {
  // On Vercel use the platform-controlled client IP header; hash identifiers before persistence.
  const ip = (
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-forwarded-for') ||
    'local'
  )
    .split(',')[0]
    .trim();
  const key = createHash('sha256')
    .update(scope + ':' + ip)
    .digest('hex');
  const result = await db().execute(
    sql`INSERT INTO rate_limits (key,count,expires_at) VALUES (${key},1,now()+${minutes}*interval '1 minute') ON CONFLICT (key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at < now() THEN 1 ELSE rate_limits.count+1 END, expires_at=CASE WHEN rate_limits.expires_at < now() THEN now()+${minutes}*interval '1 minute' ELSE rate_limits.expires_at END RETURNING count`,
  );
  return Number(result[0].count) <= limit;
}
export function apiError(code: string, status: number) {
  return Response.json({ code }, { status, headers: { 'Cache-Control': 'no-store' } });
}
