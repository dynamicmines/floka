import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { localeOf, messages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };
export default async function Success({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ receipt?: string }>;
}) {
  const locale = localeOf((await params).locale);
  const t = messages[locale];
  const { receipt } = await searchParams;
  const order =
    receipt && /^[a-f0-9]{64}$/.test(receipt)
      ? await db().query.orders.findFirst({ where: eq(orders.receiptToken, receipt) })
      : null;
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-6 py-12 text-center">
      {order ? (
        <>
          <CheckCircle2 size={52} className="text-primary" />
          <h1 className="text-3xl font-semibold">{t.accepted}</h1>
          <p className="text-xl font-semibold">#{order.publicNumber}</p>
          <p className="leading-7 text-muted-foreground">
            {t.contactSoon}
            <br />
            <strong className="text-foreground">{order.customerPhone}</strong>
          </p>
        </>
      ) : (
        <p>{t.receiptError}</p>
      )}
      <Button asChild>
        <Link href={`/${locale}`}>{t.back}</Link>
      </Button>
    </div>
  );
}
