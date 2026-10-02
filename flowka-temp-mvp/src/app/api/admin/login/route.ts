import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { adminLoginSchema } from '@/lib/validation';
import { signSession, sessionCookie, cookieOptions } from '@/lib/auth';
import { sameOrigin, rateLimit, readJson, apiError } from '@/lib/http';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 403);
  try {
    const input = adminLoginSchema.safeParse(await readJson(request));
    if (!input.success) return apiError('INVALID_CREDENTIALS', 400);
    if (Buffer.byteLength(input.data.password, 'utf8') > 72)
      return apiError('INVALID_CREDENTIALS', 400);
    if (!(await rateLimit(request, 'login', 10, 15))) return apiError('RATE_LIMIT', 429);
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH)
      return apiError('AUTH_UNAVAILABLE', 503);
    const valid = await bcrypt.compare(input.data.password, process.env.ADMIN_PASSWORD_HASH);
    if (!valid || input.data.email.toLowerCase() !== process.env.ADMIN_EMAIL.toLowerCase())
      return apiError('INVALID_CREDENTIALS', 401);
    (await cookies()).set(sessionCookie, await signSession(), cookieOptions);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return apiError('AUTH_UNAVAILABLE', 503);
  }
}
