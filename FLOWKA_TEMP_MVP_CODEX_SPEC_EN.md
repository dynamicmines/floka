# FLOWKA TEMPORARY MARKETPLACE MVP — FINAL IMPLEMENTATION SPEC

Status: canonical implementation brief for Codex  
Implementation language: English  
Website UI languages: Russian and Kazakh  
Project type: temporary standalone MVP  
Starting point: clean project from scratch

---

# 0. Core instruction

Build a brand-new standalone Flowka MVP from scratch using a clean Next.js project.

Do NOT inspect, reuse, migrate, or depend on any existing Flowka repository.

This is a temporary standalone project whose only purpose is to launch a working storefront connected to the Nazdar catalog, accept customer orders, and expose those orders in a simple admin panel.

The application must be simple, production-ready, mobile-first, and deployable to Vercel.

Do not add unrelated Flowka platform architecture.

---

# 1. Product flow

The business flow is:

1. A customer opens Flowka.
2. The customer browses products loaded from the Nazdar API.
3. The customer searches, filters, opens product pages, and adds products to cart.
4. The customer fills in:
   - customer contact details;
   - recipient contact details;
   - delivery details.
5. The customer submits the order.
6. The order is saved in Flowka's own database.
7. The order appears in `/admin`.
8. Flowka manually contacts the customer by the CUSTOMER phone number.
9. The customer transfers the final amount manually.
10. The admin manually creates the real order in Nazdar.
11. The admin stores the Nazdar order number/reference in Flowka.
12. The admin updates the Flowka order status until completion.

There is NO online payment inside Flowka.

There is NO automatic Nazdar order creation.

---

# 2. Technology stack

Create a clean Next.js project using:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- PostgreSQL
- Prisma OR Drizzle ORM
- React Hook Form
- Zod
- lucide-react
- next/image
- Server Components by default
- Route Handlers and/or Server Actions
- secure cookie-based admin authentication
- i18n for Russian and Kazakh

Use TanStack Query only if there is a real need for client-side server-state synchronization.

Do NOT build a separate backend service.

Do NOT use FastAPI.

The app must be deployable to Vercel.

---

# 3. New project requirement

This project starts from zero.

Create a fresh application with a clean structure.

Do not assume any pre-existing:

- package.json
- database
- routes
- components
- auth
- styles
- environment variables
- Flowka code
- shared libraries

Set up everything required for this standalone MVP.

---

# 4. Nazdar catalog API

Primary catalog endpoint:

```http
GET https://api.crm.nazdar.kz/mobile/menu/?page=1&per_page=100
```

Bouquet details endpoint:

```http
GET https://api.crm.nazdar.kz/mobile/bouquets/{item_id}/
```

Before implementing the catalog UI, inspect the REAL API responses and document the mapping.

Create an isolated Nazdar integration layer.

Suggested structure:

```text
src/lib/nazdar/
  client.ts
  types.ts
  normalize.ts
  catalog.ts
```

Do NOT leak raw Nazdar response shapes into UI components.

Internally normalize products to a stable application model such as:

```ts
type Product = {
  id: string;
  externalId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  oldPrice?: number | null;
  available: boolean;
  category: "flowers" | "toys";
  tags: string[];
};
```

You may extend this model after inspecting the real API.

---

# 5. Product categories

The storefront must expose exactly these user-facing categories:

```text
Flowers
Toys
```

Russian UI:

```text
Цветы
Игрушки
```

Kazakh UI:

```text
Гүлдер
Ойыншықтар
```

Inspect the Nazdar payload and implement one deterministic classification function:

```ts
classifyNazdarProduct(rawProduct): "flowers" | "toys"
```

The classification may use:

- explicit category fields;
- type fields;
- tags;
- product name;
- another stable field from the API.

Do NOT scatter classification checks across React components.

If some products cannot be reliably classified, use one explicit fallback rule and document it.

---

# 6. Catalog fetching

The browser must NOT fetch directly from `api.crm.nazdar.kz`.

Flowka's server must fetch Nazdar.

Provide an internal server layer such as:

```text
GET /api/catalog
GET /api/products/[id]
```

or equivalent server functions.

The catalog endpoint is paginated.

Implementation must:

1. fetch page 1;
2. inspect pagination metadata;
3. fetch all required remaining pages;
4. combine products;
5. normalize them;
6. filter clearly unavailable products where the API provides a reliable flag;
7. cache the result.

Recommended catalog revalidation/cache:

```text
approximately 5 minutes
```

If Nazdar is temporarily unavailable:

- do not crash the page;
- show a friendly error state;
- provide retry behavior;
- avoid a blank white screen.

---

# 7. Website languages

The public storefront MUST support:

```text
Russian
Kazakh
```

The specification and implementation comments may be in English.

All customer-facing UI must be translated into both Russian and Kazakh.

Translate:

- navigation;
- search;
- category labels;
- filters;
- sort options;
- product UI;
- cart UI;
- checkout labels;
- validation messages;
- empty states;
- errors;
- success page;
- buttons.

Use a language switcher:

```text
RU | KZ
```

Preferred route structure:

```text
/ru
/kz
/ru/product/[id]
/kz/product/[id]
/ru/checkout
/kz/checkout
```

Admin can remain Russian-only for this temporary MVP.

---

# 8. Product content language

Nazdar may provide product names/descriptions only in Russian.

For this MVP:

- Flowka interface is bilingual RU/KZ;
- product names/descriptions are displayed exactly as provided by Nazdar;
- do NOT automatically machine-translate product content;
- architecture should make future translated product content possible.

---

# 9. Visual direction

Design goals:

- clean;
- minimal;
- modern;
- calm;
- product-photo focused;
- mobile-first;
- simple;
- premium enough to feel trustworthy;
- no visual clutter.

Use a lot of white space.

Do not build a flashy marketplace UI.

---

# 10. Color system

Use design tokens.

Recommended palette:

```text
Background:       #FFFFFF
Primary text:     #111111
Secondary text:   #6B7280
Borders:          #E5E7EB
Soft background:  #F8F8F8
Primary accent:   #2E7D5A
```

Hover/active green may be slightly darker.

Do not hardcode arbitrary colors throughout components.

---

# 11. Typography

Use:

```text
Manrope
```

if it supports all required Russian and Kazakh characters correctly.

Prefer `next/font`.

If Manrope causes character/support problems, use another modern font with strong Cyrillic and Kazakh support.

---

# 12. Logo

Header branding:

```text
{logo} Flowka
```

Use:

- a minimal flower/petal mark;
- the word `Flowka`.

If there is no provided final asset, create a simple temporary SVG/component mark.

Do NOT use emoji as the final logo.

Make the logo implementation easy to replace later.

---

# 13. Responsive grid — FINAL RULE

Product grid:

```text
Mobile:             2 products per row
Tablet and desktop: 4 products per row
```

Preferred base implementation:

```tsx
grid-cols-2 md:grid-cols-4
```

Keep it visually balanced on small screens.

Do not switch to 3 columns on tablet unless there is a serious layout issue.

---

# 14. Header

## Mobile

First row:

```text
[Flowka]                    [RU/KZ] [cart]
```

Second row:

```text
[ Search products...                  ]
```

Keep the header compact.

## Desktop

Header contains:

- Flowka logo;
- search;
- language switcher;
- cart icon;
- cart quantity badge.

---

# 15. Home page `/[locale]`

Do NOT build a large hero banner.

The catalog should appear immediately.

Order of sections:

```text
Header
Search
Category controls
Price/filter/sort controls
Product grid
Footer
```

---

# 16. Search

Search placeholder in Russian:

```text
Поиск цветов и игрушек
```

Kazakh:

```text
Гүлдер мен ойыншықтарды іздеу
```

Search at minimum through:

- product name;
- description if available;
- tags if available.

Search must work together with:

- category filter;
- price filter;
- sorting.

---

# 17. Category controls

Show:

```text
All
Flowers
Toys
```

Russian:

```text
Все
Цветы
Игрушки
```

Kazakh:

```text
Барлығы
Гүлдер
Ойыншықтар
```

Use minimal chips/tabs.

---

# 18. Price filters

Required price ranges:

```text
All prices
Up to 10,000 ₸
10,000–20,000 ₸
20,000–35,000 ₸
From 35,000 ₸
```

Provide proper Russian and Kazakh translations.

---

# 19. Sorting

Required sort options:

```text
Default
Lowest price first
Highest price first
By name
```

Translate into Russian and Kazakh.

---

# 20. Mobile filters

On mobile:

- categories may remain visible as horizontal chips;
- price + sorting go inside a Sheet / Drawer / Bottom Sheet;
- use shadcn/Radix patterns where appropriate.

---

# 21. Desktop filters

On desktop:

- category;
- price;
- sorting

should appear in a clean compact row above the product grid.

Do not create a heavy permanent sidebar unless it clearly improves the final layout.

---

# 22. Product card

Each card should include only:

1. image;
2. optional small category badge;
3. product name;
4. current price;
5. old price only if an actual discount exists;
6. add-to-cart button.

Image requirements:

- consistent aspect ratio;
- `object-cover`;
- rounded corners;
- robust fallback image/placeholder.

Product title:

- max 2 lines in the grid;
- prevent card height from being destroyed by long titles.

Price example:

```text
18 500 ₸
```

Discount example:

```text
21 000 ₸   18 500 ₸
```

Old price must be crossed out.

---

# 23. Add to cart behavior

Clicking `Add to cart` must:

- add the product without leaving the page;
- update cart quantity badge;
- optionally show a small toast.

Do NOT redirect to checkout automatically.

---

# 24. Product details page

Route:

```text
/[locale]/product/[id]
```

## Mobile order

```text
Header
Image
Name
Price
Availability
Description
Quantity control
Add to cart
Buy now
```

## Desktop

Use two columns:

```text
[ Product image ] [ Product information ]
```

`Buy now` must add the item if needed and navigate to checkout.

---

# 25. Sticky mobile CTA

On mobile product pages, add a sticky bottom action bar:

```text
[ price ]      [ Add to cart ]
```

It must not cover important content.

---

# 26. Cart state

Use a simple persistent client cart.

Recommended:

- Zustand + localStorage

or another lightweight deterministic solution.

Cart must survive refresh.

Minimum cart item model:

```ts
{
  externalId: string;
  name: string;
  imageUrl?: string;
  category: "flowers" | "toys";
  unitPrice: number;
  quantity: number;
}
```

Client-side prices are NOT authoritative during order creation.

---

# 27. Checkout route

Use exactly one combined cart + order page:

```text
/[locale]/checkout
```

Do NOT create a separate cart page for this MVP.

---

# 28. Checkout desktop layout

Recommended:

```text
[ order/customer form             ] [ order summary ]
```

---

# 29. Checkout mobile layout

Recommended order:

```text
Cart items
Summary
How ordering works
Customer information
Recipient information
Delivery
Additional information
Submit order
```

---

# 30. Checkout cart items

For each cart item show:

- thumbnail;
- name;
- unit price;
- quantity;
- minus;
- plus;
- remove;
- line total.

Quantity must never become less than 1 through the minus control.

---

# 31. Delivery pricing — FINAL RULE

Base delivery:

```text
2,000 KZT
```

Additional delivery charge:

```text
+800 KZT for every additional bouquet/flower item after the first bouquet
```

TOYS DO NOT increase the additional delivery fee.

Any non-empty order has at least the base 2,000 KZT delivery charge.

Canonical formula:

```ts
const baseDelivery = 2000;

const flowerQuantity = cart
  .filter((item) => item.category === "flowers")
  .reduce((sum, item) => sum + item.quantity, 0);

const extraFlowerDelivery =
  Math.max(flowerQuantity - 1, 0) * 800;

const deliveryPrice =
  cart.length > 0
    ? baseDelivery + extraFlowerDelivery
    : 0;
```

Examples:

```text
1 bouquet                  => 2,000 ₸
2 bouquets                 => 2,800 ₸
3 bouquets                 => 3,600 ₸
1 bouquet + 1 toy          => 2,000 ₸
2 bouquets + 3 toys        => 2,800 ₸
1 toy only                 => 2,000 ₸
3 toys only                => 2,000 ₸
```

Delivery price is shown only:

- in checkout;
- in the created order/admin.

Do NOT add delivery into product card prices.

---

# 32. Checkout summary

Show:

```text
Products                  XX XXX ₸
Delivery                   X XXX ₸
----------------------------------
Total                     XX XXX ₸
```

All money is KZT.

Use integer KZT values.

---

# 33. Payment explanation

There is NO online payment.

Show a compact information block.

Russian:

```text
Как проходит заказ

1. Оформите заказ на сайте.
2. Мы свяжемся с вами по телефону.
3. Вы переводите итоговую сумму.
4. Мы подтверждаем заказ и оформляем доставку.
```

Create a natural Kazakh translation.

Do NOT create a fake card payment form.

Do NOT mark the order as paid after submission.

---

# 34. Customer information

Required fields:

```text
Customer name
Customer phone
```

Russian UI:

```text
Имя заказчика
Телефон заказчика
```

The customer phone is the PRIMARY contact number Flowka uses for payment confirmation and order communication.

Validate Kazakhstan phone numbers reasonably.

Store phones in normalized form.

---

# 35. Recipient information

Provide:

```text
I am the recipient
Another person
```

Russian UI:

```text
Я получатель
Другой человек
```

If customer is the recipient:

```text
recipientName = customerName
recipientPhone = customerPhone
recipientIsCustomer = true
```

If another person:

required:

```text
Recipient name
Recipient phone
```

Database MUST always store separate fields:

```text
customer_name
customer_phone
recipient_name
recipient_phone
recipient_is_customer
```

even when the values are equal.

---

# 36. Delivery information

City is fixed:

```text
Astana
```

Russian display:

```text
Астана
```

Do NOT show a city selector if no alternative city exists.

Required:

```text
Address
Delivery date
Delivery time
```

Optional:

```text
Apartment / office
Entrance
Floor
Intercom
Courier comment
```

Do not allow an obviously past delivery date.

Do NOT invent complex delivery slot business logic that has not been defined.

---

# 37. Additional order fields

Optional:

```text
Card message
Order comment
```

Russian:

```text
Текст для открытки
Комментарий к заказу
```

Translate naturally into Kazakh.

---

# 38. Submit order

Primary button:

Russian:

```text
Оформить заказ
```

Kazakh:

```text
Тапсырыс беру
```

Below the button show:

Russian:

```text
После оформления мы свяжемся с вами по телефону для подтверждения и оплаты.
```

Add natural Kazakh translation.

Required submit UX:

- loading state;
- prevent double-submit;
- server validation;
- useful error handling.

---

# 39. Server-side order validation

NEVER trust:

- client prices;
- client totals;
- client delivery amount.

On submit the server must:

1. receive cart product external IDs + quantities;
2. refetch/revalidate current Nazdar product data;
3. confirm products are available;
4. use current server-side prices;
5. calculate subtotal;
6. determine flower quantity;
7. calculate delivery using the canonical formula;
8. calculate total;
9. transactionally create the order.

If a price changed:

- do not silently submit a different total;
- return a clear response;
- refresh the checkout amounts;
- require the customer to submit again.

Example RU text:

```text
Цена одного из товаров изменилась. Мы обновили сумму заказа.
```

Add Kazakh translation.

---

# 40. Order success page

Route can be:

```text
/[locale]/order/success
```

Use a safe public order reference.

Show:

```text
Order accepted
#FL-XXXXXX

We will contact you shortly at:
+7 ...
```

Russian and Kazakh translations required.

Button:

```text
Back to catalog
```

Do not expose internal database IDs.

---

# 41. Public order number

Use a unique human-readable public order number such as:

```text
FL-104238
```

It must not need to equal the database primary key.

---

# 42. Database

Minimum tables:

```text
orders
order_items
```

Use an `admins` table only if the chosen auth implementation requires it.

---

# 43. Orders schema

Minimum fields:

```text
id
public_number

status

customer_name
customer_phone

recipient_name
recipient_phone
recipient_is_customer

city
address
apartment
entrance
floor
intercom

delivery_date
delivery_time

card_text
customer_comment
courier_comment

subtotal
delivery_price
total

nazdar_order_number
sent_to_nazdar_at

created_at
updated_at
```

Store money as integer KZT.

Never use floating-point money calculations.

---

# 44. Order items schema

Snapshot each product at order time.

Minimum fields:

```text
id
order_id

external_item_id
product_name
product_image
product_category

unit_price
quantity
line_total

created_at
```

Old orders must never depend on current Nazdar product data.

---

# 45. Order statuses

Use exactly:

```text
NEW
CONFIRMED
SENT_TO_NAZDAR
DELIVERING
COMPLETED
CANCELLED
```

Russian admin labels:

```text
Новый
Подтвержден
Передан Nazdar
Доставляется
Выполнен
Отменен
```

Do NOT introduce unnecessary statuses.

---

# 46. Admin login

Route:

```text
/admin/login
```

All other `/admin/*` routes must be protected.

For this temporary MVP, simple admin credentials are enough.

Requirements:

- no plaintext password in repository;
- secure password hash or equivalent secret strategy;
- HttpOnly secure session cookie;
- server/middleware route protection;
- logout;
- no public admin registration.

---

# 47. Admin home `/admin`

The main admin screen is the order list.

Desktop:

use a table.

Columns:

```text
Order #
Created
Customer
Recipient
Customer phone
Delivery date/time
Total
Status
```

Default sorting:

- new/recent orders first.

---

# 48. Admin filters

Status filters:

```text
All
New
Confirmed
Sent to Nazdar
Delivering
Completed
Cancelled
```

Search by:

```text
public order number
customer phone
recipient phone
customer name
recipient name
```

---

# 49. Admin mobile layout

Admin must be usable on mobile.

Do NOT force a huge horizontal table on small screens.

On mobile, render order cards.

Example:

```text
#FL-104238                  Новый
Арман
+7 ...
Доставка: 03.10, 18:00
24 500 ₸
```

---

# 50. Admin order details

Route:

```text
/admin/orders/[id]
```

Top section:

```text
Order #FL-104238
[STATUS]

24 500 ₸
3 October, 18:00
```

Admin can remain Russian-only.

---

# 51. Admin products block

For each order item show:

```text
[image]
Product name
quantity × unit price
line total
```

Then:

```text
Products subtotal
Delivery
Total
```

---

# 52. Admin customer block

Visually emphasize:

```text
ЗАКАЗЧИК
Имя
Телефон

[Позвонить]
```

Use `tel:` links.

This is the PRIMARY contact Flowka calls for confirmation/payment.

---

# 53. Admin recipient block

Keep separate:

```text
ПОЛУЧАТЕЛЬ
Имя
Телефон

[Позвонить]
```

Do not visually mix customer and recipient phone numbers.

---

# 54. Admin delivery block

Show:

```text
Город
Адрес
Квартира / офис
Подъезд
Этаж
Домофон
Дата
Время
Комментарий курьеру
```

Hide empty optional fields cleanly.

---

# 55. Admin additional block

If present, show:

```text
Текст открытки
Комментарий клиента
```

---

# 56. Manual Nazdar handoff

Create a distinct admin section:

```text
Передача в Nazdar
```

Show/store:

```text
Статус передачи
Номер заказа Nazdar
Дата/время передачи
```

Action:

```text
Отметить как переданный в Nazdar
```

When confirmed:

```text
status = SENT_TO_NAZDAR
sent_to_nazdar_at = now
```

Save `nazdar_order_number` if provided.

It must also be possible to add the Nazdar order number shortly after changing the status.

---

# 57. Admin status actions

Supported actions:

```text
Подтвердить
Передан в Nazdar
Доставляется
Выполнен
Отменить
```

Cancellation requires a confirmation dialog.

---

# 58. Empty states

Provide polished states.

## No search results

Russian:

```text
Ничего не найдено
Попробуйте изменить запрос или фильтры.
```

Kazakh translation required.

## Empty cart

Russian:

```text
Корзина пуста
```

CTA:

```text
Перейти к товарам
```

Kazakh translation required.

## Unavailable product

Russian:

```text
Нет в наличии
```

Disable add-to-cart.

---

# 59. Loading states

Use skeletons where appropriate:

- catalog;
- product details;
- admin list if needed.

Avoid a giant full-screen spinner for the whole application.

---

# 60. Image handling

Nazdar may return:

- absolute image URLs;
- relative image paths.

The normalizer must convert them to usable URLs.

Configure Next.js image host handling correctly.

Broken image behavior:

- show placeholder;
- never break the card layout.

---

# 61. Accessibility

Minimum requirements:

- form labels;
- keyboard navigation;
- visible focus states;
- meaningful alt text;
- sufficient contrast;
- semantic buttons;
- proper Radix/shadcn accessibility behavior.

---

# 62. Mobile quality bar

The storefront is mobile-first.

Manually verify at least:

```text
360px
375px
390px
430px
768px
1024px
1440px
```

Check:

- 2 product cards per row on mobile;
- 4 product cards per row from tablet/desktop;
- header;
- search;
- filters;
- product page;
- sticky CTA;
- cart quantity controls;
- checkout form;
- admin cards.

---

# 63. Footer

Keep the footer minimal.

Example:

```text
Flowka
© current year
```

Do not invent fake social links or policy pages.

---

# 64. SEO

Implement only the basics:

- site title;
- description;
- dynamic product title;
- favicon placeholder;
- basic OpenGraph metadata.

Do not turn this into an SEO project.

---

# 65. Performance

Priorities:

- fast mobile page load;
- optimized images;
- lazy loading where appropriate;
- cached Nazdar catalog;
- Server Components by default;
- minimal client JS;
- no unnecessary dependencies.

---

# 66. Security

Required:

- protect admin routes;
- no secrets in client bundle;
- no plaintext admin password in git;
- validate all input with Zod;
- server-side totals;
- parameterized ORM queries;
- secure production cookies;
- safe admin mutations;
- basic anti-abuse/rate limiting on order creation if practical;
- do not render unsafe Nazdar HTML directly.

---

# 67. Unit tests — delivery

Create a pure delivery calculation function and test at least:

```text
empty cart                 -> 0
1 flower                   -> 2000
2 flowers                  -> 2800
3 flowers                  -> 3600
1 toy                      -> 2000
5 toys                     -> 2000
1 flower + 2 toys          -> 2000
2 flowers + 2 toys         -> 2800
flower quantity 3 in one line -> 3600
```

---

# 68. Order calculation tests

Test:

```text
subtotal = sum(unitPrice * quantity)
delivery = calculateDelivery(cart)
total = subtotal + delivery
```

Server is the source of truth.

---

# 69. Validation schemas

Use Zod for at least:

- checkout;
- cart/order payload;
- admin login;
- admin status mutation;
- Nazdar order number.

Validate:

- names;
- phones;
- address;
- date;
- time;
- quantities;
- external IDs.

---

# 70. Recommended project structure

Example:

```text
src/
  app/
    [locale]/
      page.tsx
      product/
        [id]/
          page.tsx
      checkout/
        page.tsx
      order/
        success/
          page.tsx

    admin/
      login/
        page.tsx
      page.tsx
      orders/
        [id]/
          page.tsx

    api/
      catalog/
        route.ts
      products/
        [id]/
          route.ts
      orders/
        route.ts
      admin/
        ...

  components/
    layout/
    catalog/
    product/
    cart/
    checkout/
    admin/
    ui/

  lib/
    nazdar/
      client.ts
      types.ts
      normalize.ts
      catalog.ts

    db/
    auth/
    i18n/
    money/
    delivery/

  store/
    cart.ts

  messages/
    ru.json
    kz.json
```

You may improve this structure, but keep responsibilities separated.

---

# 71. Environment variables

Create `.env.example`.

Minimum depending on implementation:

```env
DATABASE_URL=
NAZDAR_API_BASE_URL=https://api.crm.nazdar.kz
ADMIN_EMAIL=
ADMIN_PASSWORD_HASH=
AUTH_SECRET=
```

If another secure auth solution requires more env variables, add them.

Never commit real secrets.

---

# 72. README

README must include:

1. project purpose;
2. stack;
3. prerequisites;
4. installation;
5. environment setup;
6. database migration/setup;
7. local development;
8. production build;
9. admin configuration;
10. Vercel deployment;
11. Nazdar API dependency;
12. delivery formula;
13. current MVP limitations.

---

# 73. What NOT to build

Do NOT add:

- customer registration;
- customer accounts;
- online payment;
- Stripe;
- Kaspi API;
- bonuses;
- promo codes;
- reviews;
- favorites;
- complex CMS;
- merchant dashboard;
- marketplace seller onboarding;
- Telegram;
- chat;
- map;
- push notifications;
- split payments;
- delivery zones;
- automatic Nazdar ordering;
- separate backend service;
- separate cart page;
- unrelated Flowka platform architecture.

This is intentionally a small temporary MVP.

---

# 74. Final end-to-end flow

```text
/ru or /kz
↓
browse/search/filter
↓
product page
↓
add to cart
↓
checkout
↓
customer info
↓
recipient info
↓
delivery details
↓
server revalidates Nazdar items/prices
↓
server calculates delivery
↓
order saved
↓
success page
↓
admin sees NEW order
↓
admin calls customer_phone
↓
customer transfers money
↓
admin manually creates order in Nazdar
↓
admin saves Nazdar order number
↓
SENT_TO_NAZDAR
↓
DELIVERING
↓
COMPLETED
```

---

# 75. Acceptance criteria

Do NOT consider the project complete until all relevant items below pass.

## Project setup

- [ ] fresh Next.js project created from scratch
- [ ] TypeScript enabled
- [ ] Tailwind configured
- [ ] shadcn/ui configured
- [ ] PostgreSQL connected
- [ ] ORM configured
- [ ] `.env.example` created
- [ ] README created

## Storefront

- [ ] Nazdar catalog loads from real API
- [ ] Nazdar adapter/normalizer exists
- [ ] all catalog pages are server-controlled, not direct browser-to-Nazdar
- [ ] product images work
- [ ] mobile grid = 2
- [ ] tablet/desktop grid = 4
- [ ] search works
- [ ] Flowers/Toys filtering works
- [ ] price filters work
- [ ] sorting works
- [ ] product detail works
- [ ] add to cart works
- [ ] cart survives refresh
- [ ] quantity controls work
- [ ] checkout works
- [ ] delivery rule works
- [ ] Russian UI works
- [ ] Kazakh UI works
- [ ] responsive UX checked

## Orders

- [ ] customer phone stored
- [ ] recipient phone stored separately
- [ ] server-side current product validation
- [ ] server-side price recalculation
- [ ] server-side delivery calculation
- [ ] product snapshots stored
- [ ] public order number generated
- [ ] success page works
- [ ] double submit prevented

## Admin

- [ ] admin login works
- [ ] admin routes protected
- [ ] orders list works
- [ ] status filters work
- [ ] search works
- [ ] mobile order list works
- [ ] order details work
- [ ] customer/recipient clearly separated
- [ ] phone `tel:` links work
- [ ] address visible
- [ ] totals visible
- [ ] status updates work
- [ ] Nazdar order number stored
- [ ] sent_to_nazdar_at stored
- [ ] cancellation confirmation exists

## Quality

- [ ] delivery tests pass
- [ ] order math tests pass
- [ ] lint passes
- [ ] typecheck passes
- [ ] tests pass
- [ ] production build passes
- [ ] migrations included
- [ ] no secrets committed
- [ ] no mock products in production path
- [ ] no critical TODOs in main flow

---

# 76. Implementation workflow for Codex

Work autonomously until the entire MVP is functional.

Do NOT ask for confirmation on minor implementation details that do not change the product requirements.

Recommended implementation order:

```text
1. create clean Next.js project
2. install/configure dependencies
3. design system + theme
4. RU/KZ i18n
5. Nazdar API investigation
6. Nazdar adapter/normalizer
7. catalog
8. filters/search/sort
9. product page
10. persistent cart
11. checkout
12. PostgreSQL + ORM
13. order server validation/creation
14. admin auth
15. admin list/details/statuses
16. responsive polish
17. tests
18. lint/typecheck/build
19. README and final verification
```

If the real Nazdar API differs from assumptions:

- adapt the integration layer;
- preserve all defined customer-facing behavior;
- document the discrepancy.

Do not leave mock products in the production flow if the real API is available.

Do not stop after building only the frontend.

The final application must support the full end-to-end order flow.

---

# 77. Final Codex report

At the end, report exactly:

```text
1. What was implemented
2. Project structure
3. Routes/pages created
4. Nazdar API integration and discovered response details
5. How Flowers/Toys classification works
6. How delivery calculation works
7. How server-side price/order validation works
8. Database schema and migrations
9. How admin authentication works
10. Tests executed
11. Lint/typecheck/build results
12. Required environment variables
13. How to run locally
14. How to deploy
15. Real Nazdar API limitations discovered
16. Remaining blockers, if any
```

If there are no blockers, explicitly state:

```text
No known blockers for the defined MVP scope.
```

---

# FINAL PRODUCT DECISIONS — DO NOT CHANGE

```text
Project type:
- temporary standalone MVP
- clean Next.js project from scratch

Website UI languages:
- Russian
- Kazakh

Implementation/spec language:
- English

City:
- Astana only

Products:
- fetched from Nazdar API

Categories:
- Flowers
- Toys

Customer payment on website:
- NO

Flowka manually contacts customer:
- YES

Customer manually transfers final amount:
- YES

Admin manually creates Nazdar order:
- YES

Automatic Nazdar order creation:
- NO

Product grid:
- 2 columns mobile
- 4 columns tablet/desktop

Delivery:
- base = 2,000 KZT
- +800 KZT for every bouquet after the first
- toys do NOT increase additional delivery fee

Checkout:
- cart + order form on one page

Required phone numbers:
- customer phone
- recipient phone

Admin:
- authentication
- orders list
- order details
- statuses
- Nazdar order number
- manual order processing

Design:
- clean
- minimalist
- white
- green accent
- mobile-first
- product photography first
```

This document is the canonical specification for this temporary Flowka MVP.
