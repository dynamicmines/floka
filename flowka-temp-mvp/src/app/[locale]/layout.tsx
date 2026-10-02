import { Suspense } from 'react';
import { localeOf } from '@/lib/i18n';
import { Header } from '@/components/header';
import { CartProvider } from '@/components/cart-provider';
import { LocaleDocument } from '@/components/locale-document';
export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOf((await params).locale);
  return (
    <CartProvider>
      <LocaleDocument locale={locale} />
      <Suspense>
        <Header locale={locale} />
      </Suspense>
      <main
        lang={locale === 'kz' ? 'kk' : 'ru'}
        className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8 md:px-8 md:py-10"
      >
        {children}
      </main>
      <footer className="mx-auto mt-10 flex max-w-6xl items-center justify-between border-t px-4 py-8 text-sm text-muted-foreground md:px-8">
        <span>Flowka</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </CartProvider>
  );
}
