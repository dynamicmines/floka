import 'server-only';
export function apiBase() {
  return process.env.NAZDAR_API_BASE_URL || 'https://api.crm.nazdar.kz';
}
export async function nazdarFetch(path: string, fresh = false) {
  const url = new URL(path, apiBase());
  if (url.origin !== new URL(apiBase()).origin) throw new Error('Invalid Nazdar origin');
  const response = await fetch(url, {
    ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }),
    signal: AbortSignal.timeout(15000),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Nazdar HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}
