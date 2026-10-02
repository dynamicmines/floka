'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;
export function SheetContent({
  children,
  className,
  closeLabel,
}: {
  children: React.ReactNode;
  className?: string;
  closeLabel: string;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
      <Dialog.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-background p-6 shadow-xl focus:outline-none',
          className,
        )}
      >
        {children}
        <Dialog.Close
          aria-label={closeLabel}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted"
        >
          <X size={20} />
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
