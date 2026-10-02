'use client';
import { useEffect } from 'react';
import type { Locale } from '@/lib/i18n';
export function LocaleDocument({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === 'kz' ? 'kk' : 'ru';
  }, [locale]);
  return null;
}
