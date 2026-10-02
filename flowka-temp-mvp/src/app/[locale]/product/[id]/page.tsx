import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/nazdar/catalog';
import { localeOf, messages } from '@/lib/i18n';
import { ProductDetail } from '@/components/product-detail';
import { Retry } from '@/components/retry';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  try {
    const product = await getProduct(id);
    return { title: product?.name || 'Flowka', description: product?.description || undefined };
  } catch {
    return { title: 'Flowka' };
  }
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: value, id } = await params;
  const locale = localeOf(value);
  let p;
  try {
    p = await getProduct(id);
  } catch {
    return <Retry message={messages[locale].productError} label={messages[locale].retry} />;
  }
  if (!p) notFound();
  return <ProductDetail product={p} locale={locale} />;
}
