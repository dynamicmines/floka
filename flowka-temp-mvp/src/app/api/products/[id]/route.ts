import { getProduct } from '@/lib/nazdar/catalog';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const product = await getProduct((await params).id);
    return Response.json(product ? { product } : { code: 'NOT_FOUND' }, {
      status: product ? 200 : 404,
    });
  } catch {
    return Response.json({ code: 'CATALOG_UNAVAILABLE' }, { status: 503 });
  }
}
