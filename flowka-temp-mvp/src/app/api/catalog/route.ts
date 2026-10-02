import { getCatalog } from '@/lib/nazdar/catalog';
export async function GET() {
  try {
    return Response.json({ products: (await getCatalog()).filter((p) => p.available) });
  } catch {
    return Response.json({ code: 'CATALOG_UNAVAILABLE' }, { status: 503 });
  }
}
