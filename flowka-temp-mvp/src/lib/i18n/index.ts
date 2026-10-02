import ru from '@/messages/ru.json';
import kz from '@/messages/kz.json';
import { notFound } from 'next/navigation';
export type Locale = 'ru' | 'kz';
export type Messages = typeof ru;
export const messages: Record<Locale, Messages> = { ru, kz };
export function localeOf(value: string): Locale {
  if (value !== 'ru' && value !== 'kz') notFound();
  return value;
}
