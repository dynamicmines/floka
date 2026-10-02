'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { ConfirmDialog } from './ui/confirm-dialog';
import { statusLabels } from '@/lib/validation';
type Status = keyof typeof statusLabels;
export function AdminActions({
  id,
  status,
  reference,
  sentAt,
}: {
  id: string;
  status: Status;
  reference: string | null;
  sentAt: string | null;
}) {
  const [number, setNumber] = useState(reference || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const router = useRouter();
  async function update(data: { status?: Status; nazdarOrderNumber?: string }) {
    if (busy) return;
    setBusy(true);
    setNotice('');
    try {
      const r = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        setNotice(
          r.status === 400
            ? 'Проверьте номер Nazdar (до 120 символов).'
            : 'Не удалось сохранить изменения.',
        );
        return;
      }
      setNotice('Изменения сохранены');
      router.refresh();
    } catch {
      setNotice('Не удалось сохранить изменения.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel">
        <h2 className="mb-5 text-xl font-semibold">Статус заказа</h2>
        <div className="flex flex-wrap gap-3">
          {(['CONFIRMED', 'DELIVERING', 'COMPLETED'] as const).map((s) => (
            <Button
              key={s}
              disabled={busy || status === s}
              variant="outline"
              onClick={() => update({ status: s })}
            >
              {s === 'CONFIRMED' ? 'Подтвердить' : statusLabels[s]}
            </Button>
          ))}
          <ConfirmDialog
            disabled={busy || status === 'CANCELLED'}
            onConfirm={() => update({ status: 'CANCELLED' })}
          />
        </div>
      </section>
      <section className="panel">
        <h2 className="mb-3 text-xl font-semibold">Передача в Nazdar</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Статус передачи: {sentAt ? 'Передан' : 'Не передан'}
        </p>
        {sentAt && (
          <p className="mb-4 text-sm">
            Дата передачи: {new Date(sentAt).toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}
          </p>
        )}
        <label className="field mb-4">
          Номер заказа Nazdar
          <input value={number} onChange={(e) => setNumber(e.target.value)} maxLength={120} />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy}
            onClick={() => update({ status: 'SENT_TO_NAZDAR', nazdarOrderNumber: number })}
          >
            Отметить как переданный в Nazdar
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => update({ nazdarOrderNumber: number })}
          >
            Сохранить номер
          </Button>
        </div>
      </section>
      {notice && (
        <p role="status" className="rounded-xl bg-muted p-4 text-sm">
          {notice}
        </p>
      )}
    </>
  );
}
