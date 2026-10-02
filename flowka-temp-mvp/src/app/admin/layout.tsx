import Link from 'next/link';
import { Logo } from '@/components/logo';
export const metadata = { title: 'Управление заказами', robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b px-4 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin">
            <Logo />
          </Link>
          <Link href="/ru" className="text-sm text-muted-foreground">
            Витрина
          </Link>
        </div>
      </header>
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">{children}</main>
    </>
  );
}
