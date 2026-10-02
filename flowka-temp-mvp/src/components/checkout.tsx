'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Trash2, Phone, Truck } from 'lucide-react';
import { useCart } from '@/store/cart';
import { checkoutSchema, astanaToday, type CheckoutValues } from '@/lib/validation';
import type { CartItem } from '@/lib/product';
import type { Locale } from '@/lib/i18n';
import { messages } from '@/lib/i18n';
import { calculateOrder, money } from '@/lib/money';
import { Button } from './ui/button';
import { ProductImage } from './product-image';
export function Checkout({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const router = useRouter();
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const [notice, setNotice] = useState('');
  const requestId = useRef<string | null>(null);
  const lock = useRef(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    setValue,
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema(locale)),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      recipientIsCustomer: true,
      recipientName: '',
      recipientPhone: '',
      address: '',
      apartment: '',
      entrance: '',
      floor: '',
      intercom: '',
      deliveryDate: '',
      deliveryTime: '',
      courierComment: '',
      cardText: '',
      customerComment: '',
    },
  });
  const self = watch('recipientIsCustomer');
  const totals = calculateOrder(items);
  async function submit(customer: CheckoutValues) {
    if (lock.current) return;
    lock.current = true;
    setNotice('');
    requestId.current ||= crypto.randomUUID();
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale,
          requestId: requestId.current,
          customer,
          expectedTotal: totals.total,
          items: items.map((i) => ({
            externalId: i.externalId,
            quantity: i.quantity,
            expectedUnitPrice: i.unitPrice,
          })),
        }),
      });
      const data = await response.json();
      if (response.status === 409 && data.items) {
        useCart.getState().replace(data.items as CartItem[]);
        requestId.current = null;
        setNotice(data.code === 'PRICE_CHANGED' ? t.priceChanged : t.unavailableError);
        return;
      }
      if (!response.ok) {
        if (data.fields)
          for (const [field, message] of Object.entries(data.fields))
            setError(field as keyof CheckoutValues, { message: String(message) });
        setNotice(
          response.status === 429
            ? t.rateError
            : response.status === 400
              ? t.invalid
              : t.orderError,
        );
        return;
      }
      useCart.getState().clear();
      router.push(`/${locale}/order/success?receipt=${encodeURIComponent(data.receipt)}`);
    } catch {
      setNotice(t.orderError);
    } finally {
      lock.current = false;
    }
  }
  function field(name: keyof CheckoutValues, type = 'text', required = false) {
    const label = t[name as keyof typeof t] as string;
    return (
      <label className="field" key={name}>
        <span>
          {label}
          {!required && <span className="ml-1 text-xs text-muted-foreground">({t.optional})</span>}
        </span>
        <input
          {...register(name)}
          type={type}
          required={required}
          min={type === 'date' ? astanaToday() : undefined}
          maxLength={type === 'tel' ? 30 : 300}
          autoComplete={
            name === 'customerName'
              ? 'name'
              : name === 'customerPhone'
                ? 'tel'
                : name === 'address'
                  ? 'street-address'
                  : 'off'
          }
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? name + '-error' : undefined}
        />
        <span id={name + '-error'} className="text-xs text-destructive">
          {errors[name]?.message}
        </span>
      </label>
    );
  }
  function textarea(name: 'courierComment' | 'cardText' | 'customerComment') {
    return (
      <label className="field">
        <span>
          {t[name]} <span className="text-xs text-muted-foreground">({t.optional})</span>
        </span>
        <textarea {...register(name)} maxLength={1000} aria-invalid={!!errors[name]} />
        {errors[name] && <span className="text-xs text-destructive">{errors[name]?.message}</span>}
      </label>
    );
  }
  if (!items.length)
    return (
      <div className="grid justify-items-center gap-6 py-20 text-center">
        <ShoppingBag size={40} className="text-primary" />
        <h1 className="text-2xl font-semibold">{t.empty}</h1>
        {notice && (
          <p role="alert" className="text-sm text-muted-foreground">
            {notice}
          </p>
        )}
        <Button asChild>
          <Link href={`/${locale}`}>{t.back}</Link>
        </Button>
      </div>
    );
  return (
    <>
      <h1 className="mb-8 text-3xl font-semibold">{t.checkout}</h1>
      <form
        noValidate
        onSubmit={handleSubmit(submit, () => setNotice(t.invalid))}
        className="grid gap-6 md:grid-cols-[1fr_360px]"
      >
        <div className="panel md:col-start-1">
          <h2 className="mb-6 text-xl font-semibold">{t.cart}</h2>
          <div className="divide-y">
            {items.map((i) => (
              <div key={i.externalId} className="flex gap-3 py-5 first:pt-0">
                <Link
                  href={`/${locale}/product/${i.externalId}`}
                  className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  <ProductImage src={i.imageUrl} name={i.name} sizes="80px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${locale}/product/${i.externalId}`}
                    className="text-sm font-semibold"
                  >
                    {i.name}
                  </Link>
                  <p className="my-2 text-sm text-muted-foreground">{money(i.unitPrice)}</p>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t.minus}
                        disabled={i.quantity <= 1 || isSubmitting}
                        onClick={() => setQuantity(i.externalId, i.quantity - 1)}
                      >
                        −
                      </Button>
                      <span className="w-6 text-center text-sm">{i.quantity}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={t.plus}
                        disabled={i.quantity >= 99 || isSubmitting}
                        onClick={() => setQuantity(i.externalId, i.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <strong className="text-sm">{money(i.unitPrice * i.quantity)}</strong>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={t.remove}
                      disabled={isSubmitting}
                      onClick={() => remove(i.externalId)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="panel h-fit md:col-start-2 md:row-span-3 md:row-start-1 md:sticky md:top-6">
          <h2 className="mb-6 text-xl font-semibold">{t.total}</h2>
          <dl className="grid gap-4">
            <div className="flex justify-between">
              <dt>{t.products}</dt>
              <dd>{money(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t.delivery}</dt>
              <dd>{money(totals.deliveryPrice)}</dd>
            </div>
            <div className="flex justify-between border-t pt-4 text-lg font-bold">
              <dt>{t.total}</dt>
              <dd>{money(totals.total)}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">{t.deliveryNote}</p>
        </aside>
        <section className="rounded-2xl bg-muted p-6 md:col-start-1">
          <h2 className="mb-3 font-semibold">{t.how}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
            {t.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
        <fieldset className="panel grid gap-4 md:col-start-1" disabled={isSubmitting}>
          <legend className="px-2 text-lg font-semibold">
            <Phone size={18} className="mr-2 inline" />
            {t.customer}
          </legend>
          {field('customerName', 'text', true)}
          {field('customerPhone', 'tel', true)}
          <p className="text-xs text-muted-foreground">{t.phoneHint}</p>
        </fieldset>
        <fieldset className="panel grid gap-4 md:col-start-1" disabled={isSubmitting}>
          <legend className="px-2 text-lg font-semibold">{t.recipient}</legend>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="recipientChoice"
                checked={self}
                onChange={() => setValue('recipientIsCustomer', true)}
              />
              {t.self}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="recipientChoice"
                checked={!self}
                onChange={() => setValue('recipientIsCustomer', false)}
              />
              {t.another}
            </label>
          </div>
          {!self && (
            <>
              {field('recipientName', 'text', true)}
              {field('recipientPhone', 'tel', true)}
            </>
          )}
        </fieldset>
        <fieldset className="panel grid gap-4 md:col-start-1" disabled={isSubmitting}>
          <legend className="px-2 text-lg font-semibold">
            <Truck size={18} className="mr-2 inline" />
            {t.delivery} · {t.city}
          </legend>
          {field('address', 'text', true)}
          <div className="grid grid-cols-2 gap-4">
            {field('apartment')}
            {field('entrance')}
            {field('floor')}
            {field('intercom')}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('deliveryDate', 'date', true)}
            {field('deliveryTime', 'time', true)}
          </div>
          {textarea('courierComment')}
        </fieldset>
        <fieldset className="panel grid gap-4 md:col-start-1" disabled={isSubmitting}>
          <legend className="px-2 text-lg font-semibold">{t.additional}</legend>
          {textarea('cardText')}
          {textarea('customerComment')}
        </fieldset>
        <div className="md:col-start-1">
          {notice && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-primary/30 bg-muted p-4 text-sm leading-6"
            >
              {notice}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t.submitting : t.submit}
          </Button>
          <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
            {t.afterSubmit}
          </p>
        </div>
      </form>
    </>
  );
}
