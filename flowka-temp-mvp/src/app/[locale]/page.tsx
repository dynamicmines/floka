import { Suspense } from 'react';
import { getCatalog } from '@/lib/nazdar/catalog';
import { localeOf, messages } from '@/lib/i18n';
import { Catalog } from '@/components/catalog';
import { Retry } from '@/components/retry';
export const dynamic = 'force-dynamic';
export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = localeOf((await params).locale);
  const t = messages[locale];
  let products;
  try {
    products = await getCatalog();
  } catch {
    return <Retry message={t.catalogError} label={t.retry} />;
  }
  return (
    <Suspense>
      <h1 className="sr-only">{t.catalog}</h1>
      <Catalog products={products} locale={locale} />
    </Suspense>
  );
}
