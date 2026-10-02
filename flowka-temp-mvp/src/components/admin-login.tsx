'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
export function AdminLogin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  return (
    <form
      className="panel mx-auto grid max-w-md gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError('');
        const data = new FormData(e.currentTarget);
        try {
          const r = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
          });
          if (!r.ok) {
            setError(
              r.status === 429
                ? 'Слишком много попыток. Попробуйте через 15 минут.'
                : r.status === 503
                  ? 'Вход временно недоступен. Проверьте конфигурацию сервера.'
                  : 'Неверная почта или пароль.',
            );
            return;
          }
          router.push('/admin');
          router.refresh();
        } catch {
          setError('Не удалось войти. Попробуйте ещё раз.');
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="text-2xl font-semibold">Вход для администратора</h1>
      <label className="field">
        Почта
        <input type="email" name="email" required autoComplete="username" maxLength={254} />
      </label>
      <label className="field">
        Пароль
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          maxLength={128}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button disabled={busy}>{busy ? 'Входим…' : 'Войти'}</Button>
    </form>
  );
}
