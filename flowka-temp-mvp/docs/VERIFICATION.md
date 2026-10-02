# Verification

Verified on 2026-10-02 in the isolated standalone project, using the production Next.js server, the real Nazdar API and local PostgreSQL 18.4.

## Final checks

| Check                                         | Result                                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `npm test`                                    | 40 tests passed across 5 files                                      |
| `npm run test:e2e`                            | 4 browser scenarios passed                                          |
| `npm run lint`                                | Passed, no warnings                                                 |
| `npm run typecheck`                           | Passed                                                              |
| `npm run build`                               | Passed                                                              |
| `npm run format:check`                        | Passed                                                              |
| `npm audit --omit=dev --audit-level=moderate` | No production vulnerabilities reported                              |
| `npm run db:migrate`                          | Applied successfully; repeated successfully without recreating data |

## Tested behavior

Unit coverage includes all canonical delivery examples, integer order math, the observed Nazdar envelope and prices, discount rules, type-qualified IDs, scope/classification, availability, image-origin restrictions, pagination and upstream failure, checkout validation and Kazakhstan phones, Astana dates, combined search/price/category/sorting, admin statuses/references and authoritative price/category/stock revalidation.

Browser scenarios cover:

1. Real catalog, language switching, combined search and filters, product details, persistent cart, deliberately stale displayed price, explicit re-submission, actual order persistence and RU/KZ confirmation.
2. Origin enforcement, invalid and tampered payload rejection, localized server errors, concurrent idempotency, snapshots/totals, protected admin routes/mutations, bcrypt login and secure cookie attributes, order search/status filters, customer/recipient call links, manual Nazdar handoff, late reference entry, timestamps, delivery/completion statuses, cancellation confirmation and logout.
3. Layout and visual checks at 360, 375, 390, 430, 768, 1024 and 1440 pixels. Catalog grid columns, mobile filter sheet, product actions/sticky CTA, RU/KZ checkout forms, admin cards/table and admin details. No document horizontal overflow. Generated 63 screenshots in `test-results/responsive/`; representative screenshots were visually reviewed at every required width.
4. A real three-toy order with the customer as recipient: 2,000 KZT delivery, normalized phones and separate identical customer/recipient fields.

Browser requests were checked by hostname to confirm no direct Nazdar calls. Product images use Flowka's Next.js optimizer. Test orders were removed after verification; the local database then contained zero orders and zero order items. No Nazdar order was created.

Deployment setup is included but no production Vercel deployment or hosted database was provisioned. Production deployment requires the environment variables and migration steps described in the README.
