'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';
import { messages } from '@/lib/i18n';
import type { Product } from '@/lib/product';
import { money } from '@/lib/money';
import { useCart } from '@/store/cart';
import { ProductImage } from './product-image';
import { AddButton } from './add-button';
import { Button } from './ui/button';
export function ProductDetail({ product: p, locale }: { product: Product; locale: Locale }) {
  const t = messages[locale];
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const add = useCart((s) => s.add);
  return (
    <div className="grid gap-8 pb-24 md:grid-cols-2 md:gap-16 md:pb-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted">
        <ProductImage
          src={p.imageUrl}
          name={p.name}
          priority
          sizes="(max-width: 767px) 100vw, 50vw"
        />
      </div>
      <div className="md:py-8">
        <p className="mb-3 text-sm text-muted-foreground">{t[p.category]}</p>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">{p.name}</h1>
        <div className="my-6 flex items-baseline gap-3">
          {p.oldPrice && <del className="text-muted-foreground">{money(p.oldPrice)}</del>}
          <strong className="text-2xl">{money(p.price)}</strong>
        </div>
        <p className={p.available ? 'text-primary' : 'text-muted-foreground'}>
          {p.available ? t.available : t.unavailable}
        </p>
        {p.description && (
          <section className="my-8">
            <h2 className="mb-3 font-semibold">{t.description}</h2>
            <p className="whitespace-pre-line leading-7 text-muted-foreground">{p.description}</p>
          </section>
        )}
        <div className="my-6 flex items-center gap-4">
          <span>{t.quantity}</span>
          <div className="flex items-center rounded-xl border">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t.minus}
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              disabled={qty <= 1}
            >
              −
            </Button>
            <span className="w-8 text-center">{qty}</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t.plus}
              onClick={() => setQty((n) => Math.min(99, n + 1))}
              disabled={qty >= 99}
            >
              +
            </Button>
          </div>
        </div>
        <div className="grid gap-3">
          <AddButton product={p} locale={locale} quantity={qty} />
          <Button
            variant="outline"
            disabled={!p.available}
            onClick={() => {
              const existing = useCart.getState().items.find((i) => i.externalId === p.id);
              if (!existing) add(p, qty);
              router.push(`/${locale}/checkout`);
            }}
          >
            {t.buy}
          </Button>
        </div>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
        <strong>{money(p.price)}</strong>
        <AddButton product={p} locale={locale} quantity={qty} />
      </div>
    </div>
  );
}
