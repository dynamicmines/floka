import { cookies } from 'next/headers';
import { sessionCookie, cookieOptions } from '@/lib/auth';
import { sameOrigin, apiError } from '@/lib/http';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return apiError('FORBIDDEN', 403);
  (await cookies()).set(sessionCookie, '', { ...cookieOptions, maxAge: 0 });
  return Response.json({ ok: true });
}
