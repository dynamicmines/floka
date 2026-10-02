# Flowka temporary MVP

A fresh standalone Next.js application for selling Nazdar flowers and toys in Astana. Flowka saves orders in its own PostgreSQL database. Staff call the **customer phone**, arrange a manual transfer, create the Nazdar order manually, and update its reference/status. There are no customer accounts, online payments, or automatic Nazdar order creation.

The canonical product specification is `../FLOWKA_TEMP_MVP_CODEX_SPEC_EN.md`. No existing Flowka source or architecture was used.

## Stack

Next.js App Router, TypeScript, React, Tailwind CSS v4, shadcn/ui configuration and local UI components with Radix primitives, React Hook Form, Zod, Zustand, Drizzle ORM and PostgreSQL. Manrope is self-hosted through `next/font/local`, with its OFL license included. Tests use Vitest and Playwright.

## Prerequisites and installation

Node.js 22 LTS or later, npm, network access to Nazdar, and a PostgreSQL database (local or hosted). Use a pooled PostgreSQL connection URL on Vercel; the SQL client disables prepared statements for pooler compatibility.

```sh
cd flowka-temp-mvp
npm ci
cp .env.example .env.local
```

Set these **server-only** variables in `.env.local`:

| Variable              | Purpose                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string; require SSL for hosted databases according to provider instructions       |
| `NAZDAR_API_BASE_URL` | `https://api.crm.nazdar.kz`                                                                             |
| `ADMIN_EMAIL`         | Admin email, no public registration                                                                     |
| `ADMIN_PASSWORD_HASH` | bcrypt hash (12 rounds recommended), never the plaintext password                                       |
| `AUTH_SECRET`         | Random secret, at least 32 characters                                                                   |
| `APP_URL`             | Exact public origin; `http://localhost:3000` locally; used for same-origin mutation checks and metadata |

Generate `AUTH_SECRET` with `openssl rand -hex 48`. Generate a password hash without putting the password in shell history:

```sh
read -s ADMIN_PASSWORD
printf '%s' "$ADMIN_PASSWORD" | npm run admin:hash
unset ADMIN_PASSWORD
```

Choose an admin password with at least 12 characters and at most 72 UTF-8 bytes. Copy only the emitted bcrypt hash to `ADMIN_PASSWORD_HASH`. **In `.env.local`, prefix every dollar sign in the hash with one backslash**, because Next.js expands dollar-prefixed variable references. In Vercel’s environment-variable UI, paste the original hash with unescaped dollar signs. `.env.local` and `.local-db` are ignored. The application fails closed when authentication configuration is missing. No deployment secrets or admin password are committed.

## PostgreSQL and migrations

Use an existing PostgreSQL instance, or start the optional isolated local development instance:

```sh
npm run db:local
```

Keep that process running and set:

```env
DATABASE_URL=postgresql://flowka:local-development-only@127.0.0.1:54329/flowka
```

The embedded database is a **development-only** runtime, bound to loopback. Production uses hosted PostgreSQL. Do not expose this development database or reuse its sample password in production.

Apply the included migration before starting the app:

```sh
npm run db:migrate
```

`drizzle/0000_optimal_angel.sql` creates `orders`, `order_items`, the exact six-status enum, and `rate_limits`. Orders contain separate customer/recipient names and normalized phones, address details, delivery date/time, comments, integer totals, manual Nazdar reference/timestamp, public number, and retry/receipt metadata. Items store immutable product snapshots. Foreign keys, unique retry/public numbers and SQL arithmetic constraints enforce consistency. Rate limits are shared across server instances through PostgreSQL.

For intentional schema changes, run `npm run db:generate`, review generated SQL, and apply it with `npm run db:migrate`. Migrations are deliberately separate from builds and requests.

## Development and production checks

```sh
npm run dev
# http://localhost:3000/ru or /kz; /admin/login for staff
npm test
npm run lint
npm run typecheck
npm run build
npm run start
```

For full browser verification, configure a disposable database and set `E2E_ADMIN_PASSWORD` to the plaintext password matching `ADMIN_PASSWORD_HASH` **only in the local ignored environment**. Tests use `ADMIN_EMAIL`. The test suite creates real test orders and removes its own successfully tracked orders on completion. It does not create upstream Nazdar orders. Do not run it against a live production database.

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

Browser tests run the production server and verify real Nazdar data, both languages, price-change resubmission, PostgreSQL snapshots, concurrent request idempotency, admin authentication/statuses/manual reference, cancellation confirmation and responsive widths 360/375/390/430/768/1024/1440. Screenshots are generated in ignored `test-results/responsive/`.

## Routes

- `/` redirects to `/ru`.
- `/ru`, `/kz`: catalog, search, category/price filters, sorting.
- `/[locale]/product/[id]`: product detail; IDs are type-qualified, e.g. `bouquet-4`, `product-24`.
- `/[locale]/checkout`: persistent cart and checkout in one page.
- `/[locale]/order/success?receipt=…`: opaque 256-bit receipt token; internal IDs are not exposed.
- `/admin/login`: staff login.
- `/admin`: protected order list, search, status filters and pagination.
- `/admin/orders/[id]`: protected snapshot details and manual processing.
- `/api/catalog`, `/api/products/[id]`: normalized server catalog APIs.
- `/api/orders`: validated, re-priced transactional order creation.
- `/api/admin/login`, `/api/admin/logout`, `/api/admin/orders/[id]`: protected staff mutations.

## Nazdar integration

See [docs/NAZDAR_API.md](docs/NAZDAR_API.md) for observed payloads, mapping, classification and limitations. The browser never requests Nazdar directly, including images: `next/image` proxies/optimizes allowed upstream media through the Flowka server. No raw response objects are passed to UI components. Names/descriptions remain as supplied by Nazdar, while all storefront controls, labels, messages and validation are translated into Russian and Kazakh.

Catalog results are cached for approximately 300 seconds. Checkout bypasses caches and refetches every menu page. Any incomplete, malformed, unsafe, unavailable or invalid-price response fails closed. Friendly retry UI handles read failures.

## Delivery and order integrity

For every nonempty order: `2000 + max(flowerQuantity - 1, 0) * 800` KZT. The sum uses quantities, not lines. Toys never add the 800 KZT fee. Empty cart delivery is zero. Houseplants, as flower items, count toward the flower quantity. Product prices do not include delivery.

Only IDs/quantities plus the customer's previously displayed prices/total are accepted. Displayed values are used **only to detect a change and request renewed consent**; the server reads current prices/categories/stock from Nazdar and calculates all persisted totals. Changed prices or totals return HTTP 409 with an updated normalized cart; the customer submits again. Missing/unavailable/insufficient-stock products also return an updated cart. No order is saved in either case.

Creation is transactional and retry-safe through a unique request UUID and request-body fingerprint. Public numbers are independent random `FL-XXXXXX` references, with unique-constraint collision retries. Orders start at `NEW`, never paid. A random opaque receipt gives access only to the confirmation, public number and customer phone; it must be treated as a private link.

## Admin authentication and security

Passwords are compared to the configured bcrypt hash. An eight-hour signed HS256 JWT is stored in an HttpOnly, SameSite=Strict cookie, Secure in production. The JWT is bound to the current credential configuration, so changing admin credentials invalidates old sessions. Every protected admin page and mutation checks authentication on the server; middleware is not the only line of protection. Logout clears the cookie. Mutations enforce `Origin === APP_URL`, validate schemas, and use parameterized ORM queries.

Database-backed limits apply to order creation (20 attempts/10 minutes) and login (10 attempts/15 minutes). On Vercel the platform client-IP header is preferred; other deployments must configure a trusted reverse proxy rather than accept arbitrary forwarded IP headers. Expired limit rows are reused on the next attempt. Standard security headers are configured. Upstream HTML is rendered only as escaped text.

## Vercel deployment

1. Import the fresh `flowka-temp-mvp` directory as the Vercel project root; select the Next.js framework preset.
2. Provision hosted PostgreSQL and set all variables above for the target environment. Set `APP_URL` to the exact HTTPS domain. Use separate staging/production databases.
3. Run `npm ci` and `npm run db:migrate` against the target database in an authorized deployment job or locally using the target connection URL. Do this before accepting traffic.
4. Deploy. Vercel runs `npm run build` with Node 22. `vercel.json` specifies the framework/build command. No separate backend is required.
5. Verify `/ru`, `/kz`, `/admin/login`, catalog images, a controlled test order and manual status/reference updates. Delete test orders through an authorized database operation if appropriate.

No hosting account, production database or deployment was provisioned as part of local implementation. Deploying requires your Vercel project, production credentials, and database connection.

## Defined MVP limitations

Astana only; manual payment/confirmation; manual Nazdar ordering; one configured staff identity; product content is not machine-translated. No delivery zones, slot capacity management, product modifiers or other out-of-scope features. Live inventory can change after Flowka saves an order, because the upstream API does not reserve stock through this read-only integration. Staff confirm availability manually during the Nazdar handoff. Houseplants are classified as Flowers; sweets, cards, vases and envelopes are omitted from the two-category storefront. Nazdar exposes no reliable stock count when `quantity` is null. The catalog can be unavailable when its upstream dependency fails, and order submission then safely refuses to persist unverified orders.

Product photo source audit, browser dimensions and before/after comparisons: [image quality report](docs/image-quality/REPORT.md).
