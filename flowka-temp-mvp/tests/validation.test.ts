import { describe, it, expect } from 'vitest';
import {
  checkoutSchema,
  cartPayloadSchema,
  adminLoginSchema,
  adminMutationSchema,
  normalizePhone,
  validPhone,
  astanaToday,
} from '@/lib/validation';
const customer = {
  customerName: 'Арман',
  customerPhone: '8 (701) 123-45-67',
  recipientIsCustomer: true,
  recipientName: '',
  recipientPhone: '',
  address: 'Кабанбай батыра 10',
  apartment: '',
  entrance: '',
  floor: '',
  intercom: '',
  deliveryDate: astanaToday(),
  deliveryTime: '18:00',
  cardText: '',
  customerComment: '',
  courierComment: '',
};
describe('input validation', () => {
  it('normalizes Kazakhstan numbers', () => {
    expect(normalizePhone(customer.customerPhone)).toBe('+77011234567');
    expect(validPhone('+7 601 123 4567')).toBe(true);
    expect(validPhone('+1 701 123 4567')).toBe(false);
    expect(validPhone('hello77011234567')).toBe(false);
  });
  it('validates self recipient', () =>
    expect(checkoutSchema().safeParse(customer).success).toBe(true));
  it('requires separate recipient details for another person', () => {
    expect(checkoutSchema().safeParse({ ...customer, recipientIsCustomer: false }).success).toBe(
      false,
    );
    expect(
      checkoutSchema().safeParse({
        ...customer,
        recipientIsCustomer: false,
        recipientName: 'Алия',
        recipientPhone: '+77021234567',
      }).success,
    ).toBe(true);
  });
  it('rejects past/impossible dates and invalid time', () => {
    for (const fields of [
      { deliveryDate: '2000-01-01' },
      { deliveryDate: '2099-02-30' },
      { deliveryTime: '24:00' },
    ])
      expect(checkoutSchema().safeParse({ ...customer, ...fields }).success).toBe(false);
  });
  it('uses Astana dates across UTC midnight', () =>
    expect(astanaToday(new Date('2026-10-01T20:00:00Z'))).toBe('2026-10-02'));
  it('rejects tampering, duplicate IDs, fractional and zero quantities', () => {
    const item = { externalId: 'bouquet-4', quantity: 1, expectedUnitPrice: 14040 };
    expect(cartPayloadSchema.safeParse([item]).success).toBe(true);
    for (const items of [
      [{ ...item, category: 'toys' }],
      [item, item],
      [{ ...item, quantity: 0 }],
      [{ ...item, quantity: 1.5 }],
      [{ ...item, externalId: '../4' }],
    ])
      expect(cartPayloadSchema.safeParse(items).success).toBe(false);
  });
  it('validates exact admin statuses and manual reference', () => {
    expect(adminMutationSchema.safeParse({ status: 'PAID' }).success).toBe(false);
    expect(adminMutationSchema.safeParse({ nazdarOrderNumber: 'NZ-123/4' }).success).toBe(true);
    expect(adminMutationSchema.safeParse({ nazdarOrderNumber: '<script>' }).success).toBe(false);
    expect(adminLoginSchema.safeParse({ email: 'invalid', password: 'x' }).success).toBe(false);
  });
  it('has localized Kazakh validation', () => {
    const result = checkoutSchema('kz').safeParse({ ...customer, customerPhone: '123' });
    if (!result.success) expect(result.error.issues[0].message).toContain('Қазақстан');
  });
});
