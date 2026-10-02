'use client';
import { useParams } from 'next/navigation';
import { messages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const params = useParams();
  const t = messages[params.locale === 'kz' ? 'kz' : 'ru'];
  return (
    <div role="alert" className="py-20 text-center">
      <p className="mb-6">{t.error}</p>
      <Button onClick={reset}>{t.retry}</Button>
    </div>
  );
}
