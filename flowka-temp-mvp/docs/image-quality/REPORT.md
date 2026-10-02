# Product photo quality audit

Verified against the live Nazdar API and a production Next.js 16.3.8 build on 2026-10-03 (Asia/Almaty).

## Cause

The primary cause was small upstream images. Typical preview files are approximately 328×284 pixels; the optimizer correctly refused to enlarge these files. The original browser requests already asked for widths larger than the available sources, so undersized Next.js variants were not the primary cause. The old `sizes` values overestimated the actual layout widths. Default quality 75 added compression, but increasing quality cannot restore missing source detail.

The complete live menu contained 252 entries, of which 217 were eligible for this MVP. Of these, 41 exposed still-photo slider candidates. Some slider images have higher resolution, others have the same dimensions, and some are wide strips unsuitable for the existing crop. MP4 sliders are ignored. Nazdar does not expose a universal original-photo field. The adapter uses only actual `image`, `preview_image`, and `sliders[].slider_image` values; no URLs are inferred or rewritten into guessed originals.

## Verified source files

| Product     | Previous primary |      Selected source | Result                                               |
| ----------- | ---------------: | -------------------: | ---------------------------------------------------- |
| Bouquet 4   |     330×284 JPEG |    Same 330×284 JPEG | No larger still photo; detail remains source-limited |
| Bouquet 111 |     328×284 JPEG | 750×1626 JPEG slider | Higher-resolution verified still photo               |
| Toy 24      |     284×246 JPEG | 750×1626 JPEG slider | Higher-resolution verified still photo               |

Exact source URLs, original byte counts, formats and dimensions are recorded in [sources.json](sources.json). Source dimensions were measured from downloaded image bytes with Sharp, not inferred from URLs or browser `naturalWidth`.

## Actual browser downloads, 2× Retina

All downloads below were WebP delivered by Flowka's `/_next/image`. These are actual response-body dimensions, not requested optimizer widths. The browser makes no direct Nazdar requests.

| Product     | Viewport / page |  Before |    After | Requested width before → after |
| ----------- | --------------- | ------: | -------: | -----------------------------: |
| Bouquet 4   | 390 catalog     | 330×284 |  330×284 |                      640 → 384 |
| Bouquet 4   | 390 detail      | 330×284 |  330×284 |                      828 → 750 |
| Bouquet 4   | 1440 catalog    | 330×284 |  330×284 |                      750 → 512 |
| Bouquet 4   | 1440 detail     | 330×284 |  330×284 |                    1920 → 1080 |
| Bouquet 111 | 390 catalog     | 328×284 |  384×833 |                      640 → 384 |
| Bouquet 111 | 390 detail      | 328×284 | 750×1626 |                      828 → 750 |
| Bouquet 111 | 1440 catalog    | 328×284 | 512×1110 |                      750 → 512 |
| Bouquet 111 | 1440 detail     | 328×284 | 750×1626 |                    1920 → 1080 |
| Toy 24      | 390 catalog     | 284×246 |  384×833 |                      640 → 384 |
| Toy 24      | 390 detail      | 284×246 | 750×1626 |                      828 → 750 |
| Toy 24      | 1440 catalog    | 284×246 | 512×1110 |                      750 → 512 |
| Toy 24      | 1440 detail     | 284×246 | 750×1626 |                    1920 → 1080 |

At 390 pixels, catalog images remain 173×216.25 CSS pixels and detail images 358×447.5. At 1440 pixels, they remain 254×317.5 and 512×640 respectively. Both before/after runs measured 36 cases: three products, catalog and detail, mobile and desktop, each at 1×, 2× and 3× density. [before.json](before.json) and [after.json](after.json) include every downloaded dimension, URL, size hint and byte count.

## Implementation

- The server-only Nazdar adapter probes real still-photo dimensions and chooses the highest resolution usable after the existing 4:5 cover crop. Equal-resolution candidates retain the primary. A 1280×198 strip is correctly rejected in favor of a 235×294 primary.
- Probes have a timeout, 10 MiB body limit, 40-million-pixel limit, no redirects, and four-product concurrency. Failed probes retain the primary; missing/failed delivery retains the existing placeholder. Only metadata is cached, for one hour.
- Product-detail resolution includes verified catalog and detail sources, so a low-resolution detail preview cannot overwrite a better catalog source.
- Catalog sizes: `(max-width: 767px) calc(50vw - 22px), (max-width: 1151px) calc(25vw - 34px), 254px`.
- Detail sizes: `(max-width: 767px) calc(100vw - 32px), (max-width: 1151px) calc(50vw - 64px), 512px`.
- Quality 90 is explicitly allowed by `images.qualities: [75, 90]`. Width candidates include 384, 512, 750, 1080 and 1536 for appropriately sized Retina delivery.
- Layout, 2/4-column grid, aspect ratios, centered `object-cover`, fallback and business rules are unchanged. Larger supplier photos may have different native framing; their subjects are not reconstructed or retouched. No sharpening, CSS filters or video frames are used.
- All API access and source image fetching happen on the Flowka server. Browser delivery uses Next's same-origin optimizer.

## Before / after screenshots

Each comparison places actual 2× browser screenshots side by side at their original pixel dimensions; only labels were added.

- [Desktop catalog, bouquet 111](comparison-bouquet-111-catalog-1440-2x.png)
- [Mobile detail, bouquet 111](comparison-bouquet-111-detail-390-2x.png)
- [Desktop catalog, toy 24](comparison-product-24-catalog-1440-2x.png)
- [Mobile detail, bouquet 4: source limitation](comparison-bouquet-4-detail-390-2x.png)

## Verification and reproduction

48 unit tests and all 4 existing real-API/PostgreSQL browser regressions passed. Lint, TypeScript checking and the production build passed. The focused image audit additionally checks quality 90, same-origin delivery, unchanged aspect ratio and cover behavior at 1×/2×/3×. Existing responsive regressions cover widths 360, 375, 390, 430, 768, 1024 and 1440, including RU/KZ, checkout, and admin.

With the production app running on localhost:3000:

```sh
node --import tsx scripts/measure-source-images.ts
node --import tsx scripts/measure-product-images.ts after
node --import tsx scripts/compare-product-images.ts
```

The committed `before` captures are from the unchanged pre-fix production server. Do not overwrite them using the updated app. The focused after audit suppresses unrelated lazy-image requests to avoid flooding the supplier while examining three target products; real API responses and target image downloads are used, without mocks.

## Remaining source limitation

Bouquet 4 and other thumbnail-only products remain blurry at larger display sizes. Even 750-pixel-wide originals cannot fully supply a 512-pixel-wide desktop detail at 2× or 3× density (1024 or 1536 source pixels required). Cropping a landscape thumbnail into the existing portrait frame further reduces usable detail. Higher optimizer quality/output widths cannot recover absent pixels. Sharper results for those products require genuinely higher-resolution still files from Nazdar.
