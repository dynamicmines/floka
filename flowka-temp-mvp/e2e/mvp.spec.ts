import { test, expect } from '@playwright/test';
import postgres from 'postgres';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
const origin = process.env.APP_URL || 'http://localhost:3000';
const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const createdIds: string[] = [];
test.afterAll(async () => {
  if (createdIds.length) await sql`DELETE FROM orders WHERE id IN ${sql(createdIds)}`;
  await sql.end();
});
async function customer() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty' }).format(new Date());
  return {
    customerName: 'E2E Арман',
    customerPhone: '+77011234567',
    recipientIsCustomer: false,
    recipientName: 'E2E Алия',
    recipientPhone: '+77021234567',
    address: 'Кабанбай батыра 10',
    apartment: '12',
    entrance: '2',
    floor: '3',
    intercom: '12',
    deliveryDate: today,
    deliveryTime: '18:30',
    courierComment: 'Позвонить',
    cardText: 'С праздником!',
    customerComment: 'Проверка MVP',
  };
}
test('real catalog, bilingual filters, details, cart persistence, price revalidation and UI checkout', async ({
  page,
  request,
}) => {
  const direct: string[] = [];
  page.on('request', (r) => {
    if (new URL(r.url()).hostname === 'api.crm.nazdar.kz') direct.push(r.url());
  });
  const catalog = await request.get('/api/catalog');
  expect(catalog.ok()).toBeTruthy();
  const { products } = await catalog.json();
  expect(products.length).toBeGreaterThan(100);
  expect(products.some((p: { category: string }) => p.category === 'toys')).toBeTruthy();
  await page.goto('/ru');
  await expect(page.locator('article').first()).toBeVisible();
  await expect(page.locator('article')).toHaveCount(products.length);
  await page.getByRole('button', { name: 'Игрушки', exact: true }).click();
  await expect(page).toHaveURL(/category=toys/);
  await expect(page.locator('article')).toHaveCount(
    products.filter((p: { category: string }) => p.category === 'toys').length,
  );
  const firstToy = products.find((p: { category: string }) => p.category === 'toys');
  await page.getByRole('combobox', { name: 'Цена', exact: true }).selectOption('1');
  await page.getByRole('combobox', { name: 'Сортировка', exact: true }).selectOption('low');
  await page.getByRole('textbox', { name: 'Поиск цветов и игрушек' }).fill(firstToy.name);
  await page.getByRole('textbox', { name: 'Поиск цветов и игрушек' }).press('Enter');
  await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe(firstToy.name);
  expect(new URL(page.url()).searchParams.get('category')).toBe('toys');
  expect(new URL(page.url()).searchParams.get('price')).toBe('1');
  expect(new URL(page.url()).searchParams.get('sort')).toBe('low');
  await expect(page.locator('article').first()).toBeVisible();
  await page.getByRole('link', { name: 'KZ', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Ойыншықтар', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'RU', exact: true }).click();
  await page.getByRole('button', { name: 'Все', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Поиск цветов и игрушек' })
    .fill('невозможныйпоисковыйзапрос');
  await page.getByRole('textbox', { name: 'Поиск цветов и игрушек' }).press('Enter');
  await expect(page.getByText('Ничего не найдено')).toBeVisible();
  const selected = products.find((p: { externalId: string }) =>
    p.externalId.startsWith('bouquet-'),
  );
  await page.goto(`/ru/product/${selected.id}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(selected.name);
  await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
  await page.reload();
  await page.getByRole('link', { name: 'Корзина: 1' }).click();
  await expect(page.getByRole('heading', { name: 'Оформление заказа' })).toBeVisible();
  // Persisted display values are deliberately stale; the server must refuse the original total.
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('flowka-temp-cart-v1')!);
    stored.state.items[0].unitPrice = 1;
    localStorage.setItem('flowka-temp-cart-v1', JSON.stringify(stored));
  });
  await page.reload();
  await page.getByLabel('Имя заказчика', { exact: false }).fill('E2E Арман');
  await page.getByLabel('Телефон заказчика', { exact: false }).fill('+77011234567');
  await page.getByLabel('Другой человек', { exact: true }).check();
  await page.getByLabel('Имя получателя', { exact: false }).fill('E2E Алия');
  await page.getByLabel('Телефон получателя', { exact: false }).fill('+77021234567');
  await page.getByLabel('Адрес', { exact: false }).fill('Кабанбай батыра 10');
  await page.getByLabel('Дата доставки', { exact: false }).fill((await customer()).deliveryDate);
  await page.getByLabel('Время доставки', { exact: false }).fill('18:30');
  await page.getByRole('button', { name: 'Оформить заказ', exact: true }).click();
  await expect(page.locator('p[role=alert]')).toContainText('Цена одного из товаров изменилась');
  const responsePromise = page.waitForResponse(
    (r) => r.url().endsWith('/api/orders') && r.status() === 201,
  );
  await page.getByRole('button', { name: 'Оформить заказ', exact: true }).click();
  const response = await responsePromise;
  const { receipt } = await response.json();
  await expect(page.getByRole('heading', { name: 'Заказ принят' })).toBeVisible();
  await expect(page.getByText('+77011234567', { exact: true })).toBeVisible();
  const [order] = await sql`SELECT * FROM orders WHERE receipt_token=${receipt}`;
  createdIds.push(order.id);
  expect(order.customer_phone).toBe('+77011234567');
  expect(order.recipient_phone).toBe('+77021234567');
  expect(order.status).toBe('NEW');
  expect(order.public_number).toMatch(/^FL-\d{6}$/);
  const [snapshot] = await sql`SELECT * FROM order_items WHERE order_id=${order.id}`;
  expect(snapshot.unit_price).toBeGreaterThan(1);
  expect(snapshot.product_category).toBe('flowers');
  expect(order.total).toBe(order.subtotal + order.delivery_price);
  expect(direct).toEqual([]);
  await page.getByRole('link', { name: 'KZ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Тапсырыс қабылданды' })).toBeVisible();
});
test('server rejects tampering, guarantees idempotency, protects admin and persists manual processing', async ({
  request,
  page,
}) => {
  const { products } = await (await request.get('/api/catalog')).json();
  const flower = products.find((p: { category: string }) => p.category === 'flowers');
  const toy = products.find((p: { category: string }) => p.category === 'toys');
  const payload = {
    locale: 'ru',
    requestId: randomUUID(),
    expectedTotal: flower.price * 2 + toy.price * 3 + 2800,
    customer: await customer(),
    items: [
      { externalId: flower.externalId, quantity: 2, expectedUnitPrice: flower.price },
      { externalId: toy.externalId, quantity: 3, expectedUnitPrice: toy.price },
    ],
  };
  const headers = { Origin: origin };
  expect(
    (
      await request.post('/api/orders', { data: payload, headers: { Origin: 'https://evil.test' } })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post('/api/orders', {
        data: { ...payload, items: [{ ...payload.items[0], quantity: 0 }] },
        headers,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post('/api/orders', {
        data: { ...payload, items: [{ ...payload.items[0], category: 'toys' }] },
        headers,
      })
    ).status(),
  ).toBe(400);
  const invalidKz = await request.post('/api/orders', {
    data: { ...payload, locale: 'kz', customer: { ...payload.customer, customerPhone: '123' } },
    headers,
  });
  expect(invalidKz.status()).toBe(400);
  expect((await invalidKz.json()).fields.customerPhone).toContain('Қазақстан');
  const responses = await Promise.all([
    request.post('/api/orders', { data: payload, headers }),
    request.post('/api/orders', { data: payload, headers }),
  ]);
  expect(responses.every((r) => r.ok())).toBeTruthy();
  const receipts = await Promise.all(responses.map((r) => r.json()));
  expect(receipts[0].receipt).toBe(receipts[1].receipt);
  const [order] = await sql`SELECT * FROM orders WHERE request_id=${payload.requestId}`;
  createdIds.push(order.id);
  expect(order.delivery_price).toBe(2800);
  expect(order.total).toBe(payload.expectedTotal);
  expect(await sql`SELECT * FROM order_items WHERE order_id=${order.id}`).toHaveLength(2);
  expect(
    (
      await request.post('/api/orders', {
        data: { ...payload, customer: { ...payload.customer, customerName: 'Changed' } },
        headers,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.patch(`/api/admin/orders/${order.id}`, {
        data: { status: 'COMPLETED' },
        headers,
      })
    ).status(),
  ).toBe(403);
  await page.goto(`/admin/orders/${order.id}`);
  await expect(page).toHaveURL(/admin\/login/);
  await page.getByLabel('Почта', { exact: true }).fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Пароль', { exact: true }).fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Заказы', exact: true })).toBeVisible();
  const session = (await page.context().cookies()).find((c) => c.name === 'flowka_admin');
  expect(session).toMatchObject({ httpOnly: true, secure: true, sameSite: 'Strict' });
  await page.getByPlaceholder('Номер, имя или телефон').fill(order.public_number);
  await page.getByRole('button', { name: 'Найти', exact: true }).click();
  await page.getByRole('link', { name: order.public_number, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Заказчик', exact: true })).toBeVisible();
  expect(await page.getByRole('link', { name: 'Позвонить заказчику' }).getAttribute('href')).toBe(
    'tel:+77011234567',
  );
  expect(await page.getByRole('link', { name: 'Позвонить получателю' }).getAttribute('href')).toBe(
    'tel:+77021234567',
  );
  await page.getByRole('button', { name: 'Подтвердить', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Изменения сохранены');
  await page.getByRole('button', { name: 'Отметить как переданный в Nazdar' }).click();
  await expect(page.getByText('Статус передачи: Передан', { exact: true })).toBeVisible();
  await page.getByLabel('Номер заказа Nazdar', { exact: true }).fill('NZ-E2E-123');
  await page.getByRole('button', { name: 'Сохранить номер', exact: true }).click();
  await expect
    .poll(
      async () =>
        (await sql`SELECT nazdar_order_number FROM orders WHERE id=${order.id}`)[0]
          .nazdar_order_number,
    )
    .toBe('NZ-E2E-123');
  await page.getByRole('button', { name: 'Доставляется', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Изменения сохранены');
  await page.getByRole('button', { name: 'Выполнен', exact: true }).click();
  await expect
    .poll(async () => (await sql`SELECT status FROM orders WHERE id=${order.id}`)[0].status)
    .toBe('COMPLETED');
  const [saved] = await sql`SELECT * FROM orders WHERE id=${order.id}`;
  expect(saved.sent_to_nazdar_at).toBeTruthy();
  await page.getByRole('button', { name: 'Отменить заказ', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Назад', exact: true }).click();
  expect((await sql`SELECT status FROM orders WHERE id=${order.id}`)[0].status).toBe('COMPLETED');
  await page.getByRole('button', { name: 'Отменить заказ', exact: true }).click();
  await page.getByRole('button', { name: 'Да, отменить', exact: true }).click();
  await expect
    .poll(async () => (await sql`SELECT status FROM orders WHERE id=${order.id}`)[0].status)
    .toBe('CANCELLED');
  await page.goto(`/admin?status=CANCELLED&q=${order.public_number}`);
  await expect(page.getByRole('link', { name: order.public_number, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Выйти', exact: true }).click();
  await expect(page).toHaveURL(/admin\/login/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/admin\/login/);
});
test('responsive widths, mobile sheets, product CTA, RU/KZ checkout and admin cards', async ({
  page,
  request,
}) => {
  test.setTimeout(240000);
  await mkdir('test-results/responsive', { recursive: true });
  const { products } = await (await request.get('/api/catalog')).json();
  const p = products[0];
  await page.goto(`/ru/product/${p.id}`);
  await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
  await page.goto('/admin/login');
  await page.getByLabel('Почта', { exact: true }).fill(process.env.ADMIN_EMAIL!);
  await page.getByLabel('Пароль', { exact: true }).fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Заказы', exact: true })).toBeVisible();
  for (const width of [360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      '/ru',
      `/ru/product/${p.id}`,
      '/ru/checkout',
      '/kz/checkout',
      '/admin',
      `/admin/orders/${createdIds[1]}`,
    ]) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${width} ${path} overflow`).toBe(false);
      if (path === '/ru') {
        const columns = await page
          .locator('main > div.grid')
          .first()
          .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
        expect(columns).toBe(width < 768 ? 2 : 4);
        if (width < 768) {
          await page.getByRole('button', { name: 'Фильтры и сортировка' }).click();
          await expect(page.getByRole('dialog')).toBeVisible();
          await page.getByRole('combobox', { name: 'Цена', exact: true }).selectOption('1');
          await page.getByRole('button', { name: 'Показать товары', exact: true }).click();
        }
      }
      if (path.endsWith('/checkout')) {
        await expect(
          page.getByRole('textbox', {
            name: path.startsWith('/kz') ? 'Тапсырыс берушінің аты' : 'Имя заказчика',
            exact: false,
          }),
        ).toBeVisible();
      }
      await page.screenshot({
        path: `test-results/responsive/${width}-${path.replaceAll('/', '_')}.png`,
      });
      if (path.endsWith('/checkout')) {
        await page
          .getByLabel(path.startsWith('/kz') ? 'Тапсырыс берушінің аты' : 'Имя заказчика', {
            exact: false,
          })
          .scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `test-results/responsive/${width}-${path.replaceAll('/', '_')}-form.png`,
        });
      }
      if (path.includes('/product/')) {
        await page
          .getByRole('button', { name: 'Купить сейчас', exact: true })
          .scrollIntoViewIfNeeded();
        await page.screenshot({ path: `test-results/responsive/${width}-product-actions.png` });
      }
    }
  }
});

test('toy-only order stores separate identical recipient fields and base delivery', async ({
  request,
}) => {
  const { products } = await (await request.get('/api/catalog')).json();
  const toy = products.find((p: { category: string }) => p.category === 'toys');
  const payload = {
    locale: 'kz',
    requestId: randomUUID(),
    expectedTotal: toy.price * 3 + 2000,
    customer: {
      ...(await customer()),
      recipientIsCustomer: true,
      recipientName: '',
      recipientPhone: '',
      customerPhone: '8 (701) 123-45-67',
    },
    items: [{ externalId: toy.externalId, quantity: 3, expectedUnitPrice: toy.price }],
  };
  const response = await request.post('/api/orders', {
    data: payload,
    headers: { Origin: origin },
  });
  expect(response.status()).toBe(201);
  const { receipt } = await response.json();
  const [order] = await sql`SELECT * FROM orders WHERE receipt_token=${receipt}`;
  createdIds.push(order.id);
  expect(order.customer_name).toBe(order.recipient_name);
  expect(order.customer_phone).toBe('+77011234567');
  expect(order.recipient_phone).toBe(order.customer_phone);
  expect(order.recipient_is_customer).toBe(true);
  expect(order.delivery_price).toBe(2000);
  const [item] = await sql`SELECT * FROM order_items WHERE order_id=${order.id}`;
  expect(item.product_category).toBe('toys');
  expect(item.quantity).toBe(3);
});
