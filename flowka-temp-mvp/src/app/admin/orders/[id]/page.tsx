import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { statusLabels } from '@/lib/validation';
import { money } from '@/lib/money';
import { AdminActions } from '@/components/admin-actions';
import { ProductImage } from '@/components/product-image';
import { Button } from '@/components/ui/button';
export default async function Details({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const o = await db().query.orders.findFirst({ where: eq(orders.id, id) });
  if (!o) notFound();
  const items = await db().select().from(orderItems).where(eq(orderItems.orderId, id));
  const delivery = [
    ['Город', 'Астана'],
    ['Адрес', o.address],
    ['Квартира / офис', o.apartment],
    ['Подъезд', o.entrance],
    ['Этаж', o.floor],
    ['Домофон', o.intercom],
    ['Дата', o.deliveryDate],
    ['Время', o.deliveryTime],
    ['Комментарий курьеру', o.courierComment],
  ];
  return (
    <>
      <Link href="/admin" className="mb-6 inline-block text-sm text-muted-foreground underline">
        ← Все заказы
      </Link>
      <div className="mb-8 flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Заказ #{o.publicNumber}</h1>
          <p className="mt-3 text-primary">{statusLabels[o.status]}</p>
        </div>
        <div>
          <strong className="text-2xl">{money(o.total)}</strong>
          <p className="mt-3 text-muted-foreground">
            {o.deliveryDate}, {o.deliveryTime}
          </p>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="panel">
          <h2 className="mb-5 text-xl font-semibold">Товары</h2>
          <div className="divide-y">
            {items.map((i) => (
              <div key={i.id} className="flex gap-4 py-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl">
                  <ProductImage
                    src={i.productImage || undefined}
                    name={i.productName}
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{i.productName}</p>
                  <p className="my-2 text-sm text-muted-foreground">
                    {i.quantity} × {money(i.unitPrice)}
                  </p>
                  <strong>{money(i.lineTotal)}</strong>
                </div>
              </div>
            ))}
          </div>
          <dl className="mt-4 space-y-3 border-t pt-4">
            {[
              ['Товары', o.subtotal],
              ['Доставка', o.deliveryPrice],
              ['Итого', o.total],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt>{label}</dt>
                <dd className="font-semibold">{money(Number(value))}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className="grid gap-6">
          <section className="panel border-primary/40 bg-primary/5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-primary">
              Заказчик
            </h2>
            <p className="text-xl font-semibold">{o.customerName}</p>
            <a className="my-3 block text-lg font-semibold" href={`tel:${o.customerPhone}`}>
              {o.customerPhone}
            </a>
            <p className="mb-4 text-sm text-muted-foreground">
              Основной контакт для подтверждения и оплаты
            </p>
            <Button asChild>
              <a href={`tel:${o.customerPhone}`}>Позвонить заказчику</a>
            </Button>
          </section>
          <section className="panel">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider">Получатель</h2>
            <p className="font-semibold">{o.recipientName}</p>
            <a className="my-3 block" href={`tel:${o.recipientPhone}`}>
              {o.recipientPhone}
            </a>
            {o.recipientIsCustomer && (
              <p className="mb-3 text-sm text-muted-foreground">Заказчик — получатель</p>
            )}
            <Button variant="outline" asChild>
              <a href={`tel:${o.recipientPhone}`}>Позвонить получателю</a>
            </Button>
          </section>
        </div>
        <section className="panel">
          <h2 className="mb-5 text-xl font-semibold">Доставка</h2>
          <dl className="grid gap-4">
            {delivery
              .filter(([, v]) => v)
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words">{value}</dd>
                </div>
              ))}
          </dl>
        </section>
        {(o.cardText || o.customerComment) && (
          <section className="panel">
            <h2 className="mb-5 text-xl font-semibold">Дополнительная информация</h2>
            {o.cardText && (
              <div className="mb-5">
                <h3 className="text-sm text-muted-foreground">Текст открытки</h3>
                <p className="mt-2 whitespace-pre-wrap break-words">{o.cardText}</p>
              </div>
            )}
            {o.customerComment && (
              <div>
                <h3 className="text-sm text-muted-foreground">Комментарий клиента</h3>
                <p className="mt-2 whitespace-pre-wrap break-words">{o.customerComment}</p>
              </div>
            )}
          </section>
        )}
        <div className="grid gap-6 md:col-span-2">
          <AdminActions
            id={o.id}
            status={o.status}
            reference={o.nazdarOrderNumber}
            sentAt={o.sentToNazdarAt?.toISOString() || null}
          />
        </div>
      </div>
    </>
  );
}
