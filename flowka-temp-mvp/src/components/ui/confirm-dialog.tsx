'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './button';
export function ConfirmDialog({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="destructive" disabled={disabled}>
          Отменить заказ
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6">
          <Dialog.Title className="text-xl font-bold">Отменить заказ?</Dialog.Title>
          <Dialog.Description className="my-4 text-muted-foreground">
            Статус заказа будет изменён на «Отменен».
          </Dialog.Description>
          <div className="flex gap-3">
            <Dialog.Close asChild>
              <Button variant="outline">Назад</Button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <Button variant="destructive" onClick={onConfirm}>
                Да, отменить
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
