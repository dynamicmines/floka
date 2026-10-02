import { localeOf } from '@/lib/i18n';
import { Checkout } from '@/components/checkout';
export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  return <Checkout locale={localeOf((await params).locale)} />;
}
