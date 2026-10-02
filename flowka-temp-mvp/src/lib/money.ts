import type { Category } from './product';
export function money(value: number) {
  return new Intl.NumberFormat('ru-KZ').format(value) + ' ₸';
}
export function calculateDelivery(items: { category: Category; quantity: number }[]) {
  const flowers = items.filter((i) => i.category === 'flowers').reduce((s, i) => s + i.quantity, 0);
  return items.length ? 2000 + Math.max(flowers - 1, 0) * 800 : 0;
}
export function calculateOrder(
  items: { category: Category; quantity: number; unitPrice: number }[],
) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryPrice = calculateDelivery(items);
  return { subtotal, deliveryPrice, total: subtotal + deliveryPrice };
}
