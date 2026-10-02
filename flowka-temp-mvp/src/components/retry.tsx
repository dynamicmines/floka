'use client';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
export function Retry({ message, label }: { message: string; label: string }) {
  const router = useRouter();
  return (
    <div role="alert" className="grid justify-items-center gap-6 py-20 text-center">
      <p className="max-w-md text-lg">{message}</p>
      <Button onClick={() => router.refresh()}>{label}</Button>
    </div>
  );
}
