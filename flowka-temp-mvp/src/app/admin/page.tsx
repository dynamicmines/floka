import Link from 'next/link';
import { and, desc, eq, or, ilike } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { statuses, statusLabels } from '@/lib/validation';
import { money } from '@/lib/money';
import { Logout } from '@/components/logout';
import { Button } from '@/components/ui/button';
export const dynamic = 'force-dynamic';
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  await requireAdmin();
  const { q: rawQuery = '', status = '', page = '1' } = await searchParams;
  const q = rawQuery.slice(0, 120);
  const current = Math.max(1, Math.min(100000, Number.parseInt(page, 10) || 1));
  const filter = and(
    statuses.includes(status as (typeof statuses)[number])
      ? eq(orders.status, status as (typeof statuses)[number])
      : undefined,
    q
      ? or(
          ...[
            orders.publicNumber,
            orders.customerPhone,
            orders.recipientPhone,
            orders.customerName,
            orders.recipientName,
          ].map((col) => ilike(col, `%${q.replace(/[%_\\]/g, '\\$&')}%`)),
        )
      : undefined,
  );
  const list = await db()
    .select()
    .from(orders)
    .where(filter)
    .orderBy(desc(orders.createdAt))
    .limit(51)
    .offset((current - 1) * 50);
  const hasNext = list.length > 50;
  const visible = list.slice(0, 50);
  const pageLink = (p: number) => '/admin?' + new URLSearchParams({ q, status, page: String(p) });
  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Заказы</h1>
        <Logout />
      </div>
      <form className="mb-6 grid gap-3 md:grid-cols-[1fr_240px_auto]">
        <label className="field">
          <span className="sr-only">Поиск заказов</span>
          <input name="q" defaultValue={q} maxLength={120} placeholder="Номер, имя или телефон" />
        </label>
        <label className="field">
          <span className="sr-only">Статус</span>
          <select name="status" defaultValue={status}>
            <option value="">Все статусы</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </label>
        <Button>Найти</Button>
      </form>
      {!visible.length ? (
        <div className="panel py-16 text-center text-muted-foreground">Заказов не найдено</div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted">
                <tr>
                  {[
                    'Заказ',
                    'Создан',
                    'Заказчик',
                    'Получатель',
                    'Телефон заказчика',
                    'Доставка',
                    'Итого',
                    'Статус',
                  ].map((h) => (
                    <th key={h} className="p-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => (
                  <tr key={o.id} className="border-t hover:bg-muted/60">
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-primary underline underline-offset-4"
                      >
                        {o.publicNumber}
                      </Link>
                    </td>
                    <td className="p-3">
                      {o.createdAt.toLocaleString('ru-RU', {
                        timeZone: 'Asia/Almaty',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-3">{o.customerName}</td>
                    <td className="p-3">{o.recipientName}</td>
                    <td className="p-3">
                      <a href={`tel:${o.customerPhone}`}>{o.customerPhone}</a>
                    </td>
                    <td className="p-3">
                      {o.deliveryDate}
                      <br />
                      {o.deliveryTime}
                    </td>
                    <td className="p-3 whitespace-nowrap">{money(o.total)}</td>
                    <td className="p-3">
                      <span className="rounded-lg bg-muted px-2 py-1 text-xs">
                        {statusLabels[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 lg:hidden">
            {visible.map((o) => (
              <article className="panel" key={o.id}>
                <div className="mb-4 flex justify-between gap-2">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-primary">
                    #{o.publicNumber}
                  </Link>
                  <span className="text-xs text-muted-foreground">{statusLabels[o.status]}</span>
                </div>
                <p className="font-medium">{o.customerName}</p>
                <a className="my-2 block text-sm" href={`tel:${o.customerPhone}`}>
                  {o.customerPhone}
                </a>
                <p className="text-sm text-muted-foreground">
                  Доставка: {o.deliveryDate}, {o.deliveryTime}
                </p>
                <strong className="mt-3 block">{money(o.total)}</strong>
                <Link href={`/admin/orders/${o.id}`} className="mt-3 block text-sm underline">
                  Открыть заказ
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
      <nav className="mt-6 flex justify-between">
        {current > 1 ? (
          <Button asChild variant="outline">
            <Link href={pageLink(current - 1)}>Назад</Link>
          </Button>
        ) : (
          <span />
        )}
        {hasNext && (
          <Button asChild variant="outline">
            <Link href={pageLink(current + 1)}>Далее</Link>
          </Button>
        )}
      </nav>
    </>
  );
}
