'use client';
import { Button } from '@/components/ui/button';
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="panel text-center">
      <p className="mb-5">
        Не удалось загрузить заказы. Проверьте подключение к базе данных и повторите.
      </p>
      <Button onClick={reset}>Повторить</Button>
    </div>
  );
}
