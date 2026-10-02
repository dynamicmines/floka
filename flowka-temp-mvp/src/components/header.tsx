'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingBag } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { messages } from '@/lib/i18n';
import { useCart } from '@/store/cart';
import { Logo } from './logo';
export function Header({ locale }: { locale: Locale }) {
  const t = messages[locale];
  const path = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  return (
    <header className="border-b bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-5 md:grid-cols-[auto_1fr_auto] md:gap-12 md:px-8">
        <Link href={`/${locale}`} aria-label="Flowka">
          <Logo />
        </Link>
        <form
          key={params.get('q') || ''}
          className="order-3 col-span-2 flex items-center rounded-xl bg-muted px-3 md:order-none md:col-span-1"
          action={(form) => {
            const q = String(form.get('q') || '').trim();
            const next = new URLSearchParams();
            if (path === `/${locale}`) {
              for (const key of ['category', 'price', 'sort']) {
                const value = new URLSearchParams(window.location.search).get(key);
                if (value) next.set(key, value);
              }
            }
            if (q) next.set('q', q);
            const target = `/${locale}${next.size ? '?' + next.toString() : ''}`;
            if (path === `/${locale}`) window.history.pushState(null, '', target);
            else router.push(target);
          }}
        >
          <Search size={19} className="text-muted-foreground" />
          <input
            name="q"
            aria-label={t.search}
            placeholder={t.search}
            defaultValue={params.get('q') || ''}
            className="h-11 w-full border-0 bg-transparent px-3 outline-none"
          />
        </form>
        <div className="flex items-center gap-4">
          <nav aria-label={t.language} className="flex gap-2 text-xs font-semibold">
            {(['ru', 'kz'] as const).map((l) => (
              <Link
                key={l}
                href={
                  path.replace(/^\/(ru|kz)/, '/' + l) +
                  (params.toString() ? '?' + params.toString() : '')
                }
                aria-current={l === locale ? 'true' : undefined}
                className={l === locale ? 'text-foreground' : 'text-muted-foreground'}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </nav>
          <Link
            href={`/${locale}/checkout`}
            aria-label={`${t.cart}: ${count}`}
            className="relative p-2"
          >
            <ShoppingBag size={22} />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-5 text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
