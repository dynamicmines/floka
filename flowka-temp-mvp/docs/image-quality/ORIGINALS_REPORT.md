# Verified photographs, framing and supplier originals

This follow-up supersedes the framing approach in the earlier [quality audit](REPORT.md). Measurements were made against the live supplier API and a production build on 2026-10-03, Asia/Almaty.

## What was available

The audit checked all 252 live menu entries, retained the 217 products within the MVP scope, inspected all 179 bouquet detail responses, and measured all 254 eligible still-photo URLs. All detail requests succeeded. The complete image inventory, field names and per-source measurements are in [inventory.json](originals-audit/inventory.json) and [results.json](originals-audit/results.json).

The only whole-product photo fields found were menu `image`, detail `preview_image`, and `sliders[].slider_image`. There was no additional original/high-resolution field in any inspected bouquet detail. Component-flower images, modifier photos and MP4 slider videos were not treated as whole-bouquet originals. All URLs came directly from the actual SKU responses. No original-image paths were guessed.

The accessible public [Nazdar contact site](https://nazdar.abc-task.kz/) had no product photo archive or SKU-associated original images. Its linked `/ru` page, n-flor.kz and the listed Instagram profile could not be accessed during this audit. These inaccessible sources are not evidence that originals do not exist: they could contain additional supplier assets, but none could be verified or incorporated. No unrelated bouquets or search-engine pictures were substituted.

The 29 previously selected larger slider photographs remain the best verified sources for their respective products. Visual comparison of all 29 primary/slider pairs confirmed the depicted bouquets, toys and plants match. This audit found no further higher-resolution originals beyond those already exposed by the menu and sliders. Supplier association and visual agreement establish the exact product match; independent camera-original provenance cannot be established from the API alone.

Two products exposed only files explicitly named ChatGPT/Gemini-generated: bouquet-202 and bouquet-209. Those files are now excluded from adapter selection and from rendering, including older persisted carts. The existing fallback is shown until genuine camera photographs are supplied. This conservative exclusion is based on the explicit filenames, not a claim of forensic authenticity verification of all remaining images.

## Changes implemented

- Preserve the full photograph using `object-contain`, retaining the existing outer 4:5 catalog/detail frames, responsive 2/4-column grid and fallback. No stems, feet or edges are cut off to fill the frame.
- Return measured dimensions through the isolated server-side Nazdar adapter; UI receives normalized dimensions and URLs, never raw payloads.
- Limit display bounds to original dimensions divided by the actual device pixel ratio. A 330×284 source occupies at most 165×142 CSS pixels at 2× and 110×94.67 at 3×. It is not enlarged into a fictitious sharp full-frame original. Space around small photos is intentional and signals the source limitation honestly.
- Adjust `sizes` to the actual contained photo width, factoring in the original aspect ratio, the existing frame width, and the source-pixel display cap. The cart uses its 80×96 frame ratio too. Server rendering defaults to 2×; hydration and density changes apply the actual browser pixel ratio. A browser may retain a larger initially requested variant; the source cap still prevents enlargement.
- Keep quality 90 and its explicit Next.js allowlist. Quality controls compression only; it does not create source detail.
- Keep all media delivery and API traffic behind Flowka's server and same-origin Next image optimizer. Verified measured dimensions are bundled by exact supplier URL to avoid re-fetching hundreds of known files during browsing or checkout. New URLs use bounded, cached metadata probes. The supplier audit refreshes the metadata manifest; rerun it with `--refresh` if a supplier file is replaced at the same URL. If dimensions cannot be verified, intrinsic `scale-down` display prevents stretching. Failed probes retain a supplied valid still, and delivery failures retain the existing fallback.
- No AI generation, reconstruction, upscaling, sharpening, CSS filters or video extraction. Supplier images are not retouched. Business rules, pricing, delivery, ordering and database behavior are unchanged.

## Sources and actual 2× downloads

| Product     | Verified original/source dimensions | Mobile catalog download | Desktop catalog download | Mobile detail download | Desktop detail download |
| ----------- | ----------------------------------: | ----------------------: | -----------------------: | ---------------------: | ----------------------: |
| Bouquet 111 |                       750×1626 JPEG |            256×555 WebP |             320×694 WebP |          512×1110 WebP |           640×1388 WebP |
| Toy 24      |                       750×1626 JPEG |            256×555 WebP |             320×694 WebP |          512×1110 WebP |           640×1388 WebP |
| Bouquet 4   |                   330×284 JPEG only |            330×284 WebP |             330×284 WebP |           330×284 WebP |            330×284 WebP |

These are dimensions decoded from the actual browser response bytes. `naturalWidth` alone is insufficient because browser source-density correction can change it. [framed.json](framed.json) records all 36 measurements at mobile 390 and desktop 1440 widths, each at 1×, 2× and 3×, for catalog and detail. It includes frame dimensions, actual image-box dimensions, hints, optimizer URLs and byte counts. Each case had enough downloaded physical pixels for the actual contained image display, while keeping the original frame dimensions.

At 2×, bouquet 111's complete photograph occupies approximately 206×447.5 CSS pixels on mobile detail and 295×640 on desktop detail. At 3× desktop it is capped to 250×542 CSS pixels. No extra detail is claimed beyond the source's 750×1626 pixels. Smaller appropriate downloads are sharp because they represent the full photograph at its real displayed dimensions, not because compression settings recovered information.

## Before/after comparisons

The “Before” image is the previous production version (`3f9d9d8`), which used the larger supplier file but cropped it. The “After” image shows the complete real photograph with source-pixel limits. Comparisons place native 2× browser screenshots side by side without resampling or enhancement; only labels are added. The older `before.json` captures the original blurry-thumbnail baseline, and `after.json` captures the previous cropped-photo version.

- [Mobile bouquet detail: whole bouquet and stems](framing-comparison-bouquet-111-detail-390-2x.png)
- [Desktop catalog: whole toy](framing-comparison-product-24-catalog-1440-2x.png)
- [Desktop catalog: whole bouquet](framing-comparison-bouquet-111-catalog-1440-2x.png)
- [Thumbnail-only bouquet: honest native-pixel display](framing-comparison-bouquet-4-detail-390-2x.png)

## Exact originals still required

At the intended maximum desktop detail frame of 512×640 CSS pixels, 52 of 217 products have sufficient source resolution for the full photograph at 2×, and only bouquet-47 does at 3×. Consequently **165 products need genuine larger originals for 2×**, and **216 need them for 3×**. The current caps keep photographs sharp by displaying inadequate sources smaller; obtaining originals is still required to fill the intended frames sharply.

The complete named list and exact existing files are in [SUPPLIER_REQUEST.md](originals-audit/SUPPLIER_REQUEST.md), with a spreadsheet-ready [supplier-originals-request.csv](originals-audit/supplier-originals-request.csv). It includes every SKU, existing supplied source URL, measured best dimensions, density limitations and minimum original dimensions. Ask Nazdar for the full-resolution camera files corresponding to these exact assets; filenames are references to existing files, not guessed download URLs. Alternatively obtain new genuine photographs of the exact same products, centered with the entire bouquet/toy visible, ideally at least 1536×1920 for a portrait composition that fills the unchanged frame at 3×. Upscaled previews do not satisfy that request.

Examples: obtain the original corresponding to `9H7A9782_NKyBWdP.jpg` for bouquet-4, a larger camera original corresponding to `9H7A8904_копия.jpg` for bouquet-111 to support 3× without shrinking, and `9H7A3117.jpg` for toy-24. Bouquet-202 and bouquet-209 need genuine camera photographs replacing their generated-named assets.

## Verification

55 unit tests, the four complete real-API/PostgreSQL browser regressions, lint, typecheck and production build passed. The focused 36-case browser audit checks same-origin image delivery, quality 90, preserved outer aspect ratio, full-photo containment, and sufficient downloaded physical pixels for the actual display. Regression widths include 360, 375, 390, 430, 768, 1024 and 1440, RU/KZ, checkout, cart persistence and admin.

Reproduce with the production app on localhost:3000:

```sh
node --import tsx scripts/audit-supplier-photos.ts
node --import tsx scripts/report-supplier-photos.ts
node --import tsx scripts/measure-product-images.ts framed
node --import tsx scripts/compare-product-images.ts after framed
```

The supplier audit is read-only, throttles detail/media requests and reuses temporary source files in `/private/tmp/flowka-supplier-photos`. Use `node --import tsx scripts/audit-supplier-photos.ts --refresh` to re-download files after in-place supplier changes, then rebuild/redeploy the generated metadata manifest. Do not overwrite the historical `before` and `after` captures with the current version. The focused browser audit suppresses unrelated lazy images to avoid flooding the supplier; target products and photos use real responses without mocks.

The unresolved limitation is supplier access to suitable genuine originals, not an optimizer quality setting. All improvements possible with the verified accessible files have been applied.
