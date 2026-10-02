'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
export function Logout() {
  const router = useRouter();
  const [error, setError] = useState(false);
  return (
    <div>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            const r = await fetch('/api/admin/logout', { method: 'POST' });
            if (r.ok) {
              router.push('/admin/login');
              router.refresh();
            } else setError(true);
          } catch {
            setError(true);
          }
        }}
      >
        Выйти
      </Button>
      {error && <p role="alert">Не удалось выйти. Повторите.</p>}
    </div>
  );
}
