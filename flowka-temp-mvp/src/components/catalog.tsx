'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { messages } from '@/lib/i18n';
import type { Product } from '@/lib/product';
import { filterCatalog } from '@/lib/catalog-filter';
import { money } from '@/lib/money';
import { ProductImage } from './product-image';
import { AddButton } from './add-button';
import { Button } from './ui/button';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from './ui/sheet';
export function Catalog({ products, locale }: { products: Product[]; locale: Locale }) {
  const t = messages[locale];
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const query = Object.fromEntries(params);
  const filtered = filterCatalog(products, query);
  function change(key: string, value: string) {
    const next = new URLSearchParams(window.location.search);
    next.set(key, value);
    window.history.replaceState(null, '', `/${locale}?${next.toString()}`);
  }
  const selects = (
    <>
      <label className="grid gap-2 text-sm">
        <span className="md:sr-only">{t.price}</span>
        <select
          aria-label={t.price}
          value={params.get('price') || 'all'}
          onChange={(e) => change('price', e.target.value)}
        >
          <option value="all">{t.allPrices}</option>
          {['0', '1', '2', '3'].map((p, i) => (
            <option key={p} value={p}>
              {[t.price0, t.price1, t.price2, t.price3][i]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm">
        <span className="md:sr-only">{t.sort}</span>
        <select
          aria-label={t.sort}
          value={params.get('sort') || 'default'}
          onChange={(e) => change('sort', e.target.value)}
        >
          {(['default', 'low', 'high', 'name'] as const).map((s) => (
            <option key={s} value={s}>
              {t[s]}
            </option>
          ))}
        </select>
      </label>
    </>
  );
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2" role="group" aria-label={t.catalog}>
          {(['all', 'flowers', 'toys'] as const).map((c) => (
            <Button
              key={c}
              variant={(params.get('category') || 'all') === c ? 'default' : 'ghost'}
              onClick={() => change('category', c)}
              aria-pressed={(params.get('category') || 'all') === c}
            >
              {t[c]}
            </Button>
          ))}
        </div>
        <div className="hidden gap-3 md:flex">{selects}</div>
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label={t.filters}>
                <SlidersHorizontal size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent closeLabel={t.close}>
              <SheetTitle className="text-lg font-semibold">{t.filters}</SheetTitle>
              <SheetDescription className="sr-only">
                {t.price}, {t.sort}
              </SheetDescription>
              <div className="my-6 grid gap-5">{selects}</div>
              <SheetClose asChild>
                <Button className="w-full">{t.apply}</Button>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="mb-5 flex justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} {t.found}
        </span>
        {params.size > 0 && (
          <button
            onClick={() => window.history.replaceState(null, '', `/${locale}`)}
            className="underline underline-offset-4"
          >
            {t.reset}
          </button>
        )}
      </div>
      {filtered.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
          {filtered.map((p, i) => (
            <article key={p.id} className="flex min-w-0 flex-col">
              <Link href={`/${locale}/product/${p.id}`} className="group">
                <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                  <ProductImage src={p.imageUrl} name={p.name} priority={i < 4} />
                </div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t[p.category]}
                </p>
                <h2 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 group-hover:text-primary md:text-base">
                  {p.name}
                </h2>
              </Link>
              <div className="mb-3 mt-2 flex min-h-10 flex-wrap items-baseline gap-x-2">
                {p.oldPrice && (
                  <del className="text-xs text-muted-foreground">{money(p.oldPrice)}</del>
                )}
                <span className="text-base font-semibold md:text-lg">{money(p.price)}</span>
              </div>
              <AddButton
                product={p}
                locale={locale}
                className="mt-auto w-full px-1 text-xs md:text-sm"
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-2xl font-semibold">{t.noResults}</h2>
          <p className="mt-3 text-muted-foreground">{t.tryFilters}</p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.history.replaceState(null, '', `/${locale}`)}
          >
            {t.reset}
          </Button>
        </div>
      )}
    </>
  );
}
