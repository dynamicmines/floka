import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="text-2xl">Страница не найдена · Бет табылмады</h1>
      <Link className="mt-6 inline-block text-primary underline" href="/ru">
        Каталог
      </Link>
    </main>
  );
}
