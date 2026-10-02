# Nazdar API investigation and mapping

Inspected real public responses on 2026-10-02 before building the catalog UI:

- `GET https://api.crm.nazdar.kz/mobile/menu/?page=1&per_page=100`
- Pages 2 and 3 of the same endpoint.
- `GET https://api.crm.nazdar.kz/mobile/bouquets/4/`

No authentication was needed. Observed count was 252, with page sizes 100, 100 and 52. The envelope is `{previous, next, count, results}`; `next` is an absolute URL. It is followed only on the configured API origin and `/mobile/menu/` path, with loop/size guards and completeness validation.

## Product mapping

| Observed field                 | Normalized meaning                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| `item_type` + `item_id`        | `id` and `externalId`, e.g. `bouquet-4`; IDs alone collide across types                  |
| `name`, `description`          | Display content, retained exactly; no automatic translation or unsafe HTML               |
| `image`                        | Safe absolute HTTPS `/media/` image URL; relative media paths resolved                   |
| `price`                        | Regular integer KZT parsed from a decimal string, e.g. `15600.00`                        |
| `discount_price`               | Current price only when positive and below regular price; otherwise no invented discount |
| `tags[].name`                  | Normalized string tags for search                                                        |
| `tags[].id`, `item_type`, name | Adapter-only scope/classification evidence                                               |
| `exists`, `status`             | Available only when `exists=true` and `status=available`                                 |
| `quantity`                     | Optional stock cap; null means unknown, not zero                                         |
| `sell_item_id`                 | Not used as identity: may differ from `item_id`; preserved only in API schema validation |

For bouquet 4, the live menu reported `price="15600.00"`, `discount_price="14040.00"`, and `sell_item_id=176`. The detail endpoint uses `id`, `preview_image` and numeric prices instead of `item_id`, `image` and string prices. It also contains composition, category (with `name_kk`), modifiers and video sliders. Detail normalization enriches presentation; the menu remains the availability source and checkout authority across **both** item types. Toys are read from the menu because the provided details endpoint is bouquet-specific. Video sliders/modifiers are not part of this MVP.

Whole-KZT parsing rejects fractional monetary amounts instead of rounding customer charges. Image URLs outside the known Nazdar media origin are refused. Missing/broken images use a local SVG fallback.

## Deterministic classification and scope

Observed raw types: 179 `bouquet`, 73 `product`. Product groups:

- 27 tagged soft toys (`tags[].id=4`).
- 11 houseplants (`tags[].id=2`).
- 16 sweets, 10 cards, 5 vases, 4 envelopes.

`classifyNazdarProduct` is the only classification function:

1. `item_type=bouquet` → Flowers.
2. A toy tag ID 4, toy tag text or toy name (`игруш`, `toy`, `ойыншық`) → Toys.
3. Explicit fallback → Flowers.

`isInMvpScope` separately accepts bouquets, recognized toys, and botanical tag ID 2. Unrecognized non-botanical products are excluded, so fallback never presents sweets or accessories as flowers. The observed storefront has 217 eligible products: 190 Flowers and 27 Toys. Houseplants count as flower items under the exact specification's category-based delivery formula. These rules are adapter concerns and never repeated inside React components.

## Differences and upstream limitations

- The real API contains more than the two product families in the brief. Scope filtering omits unrelated accessories rather than introducing categories.
- Item IDs are not globally unique: a bouquet and toy can share the same numeric ID. Type-qualified IDs prevent incorrect checkout or details lookup.
- Menu and detail payload shapes and price types differ; separate schemas handle both.
- Discounts are real and widespread; `discount_price` supplies the actual selling price.
- Every inspected item had `status=available`; all inspected quantities were null. Availability flags can be enforced, but a reliable stock count or reservation cannot be inferred.
- Bouquet details do not provide a menu-style `status` flag; menu availability is retained.
- Many sliders are MP4 videos, not product images. They are not sent to `next/image`.
- Descriptions and names mostly use Russian, with some Kazakh names. Interface localization does not rewrite them.
- Catalog reads and validation depend on Nazdar availability. Orders fail safely if fresh validation is impossible. This read-only integration cannot prevent an upstream change after validation.
