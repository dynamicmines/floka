import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2] || 'before';
const output = 'docs/image-quality';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const measurements = [];
const allowedPhotos = new Set<string>();
if (phase === 'after') {
  for (const id of ['bouquet-4', 'bouquet-111', 'product-24']) {
    const response = await fetch(`http://localhost:3000/api/products/${id}`);
    if (!response.ok) throw new Error(`Product API failed: ${response.status}`);
    allowedPhotos.add((await response.json()).product.imageUrl);
  }
}
for (const viewport of [
  { width: 390, height: 1000 },
  { width: 1440, height: 1000 },
]) {
  for (const dpr of [1, 2, 3]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: dpr });
    const page = await context.newPage();
    if (phase === 'after') {
      // Keep unrelated lazy photos from flooding Nazdar during this focused audit.
      await page.route('**/_next/image?**', (route) => {
        const source = new URL(route.request().url()).searchParams.get('url');
        return source && allowedPhotos.has(source) ? route.continue() : route.abort();
      });
    }
    const external: string[] = [];
    const downloads = new Map<string, Promise<Buffer | undefined>>();
    page.on('response', (response) => {
      if (new URL(response.url()).pathname === '/_next/image')
        downloads.set(
          response.url(),
          response.body().catch(() => undefined),
        );
    });
    page.on('request', (r) => {
      if (new URL(r.url()).hostname === 'api.crm.nazdar.kz') external.push(r.url());
    });
    for (const id of ['bouquet-4', 'bouquet-111', 'product-24']) {
      for (const kind of ['catalog', 'detail']) {
        await page.goto(`http://localhost:3000/ru${kind === 'detail' ? '/product/' + id : ''}`);
        const image =
          kind === 'catalog'
            ? page.locator(`article a[href="/ru/product/${id}"] img`)
            : page.locator('main img').first();
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(async (el) => {
          const img = el as HTMLImageElement;
          if (!img.complete)
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('image failed'));
            });
          await img.decode();
        });
        const info = await image.evaluate((el) => {
          const img = el as HTMLImageElement;
          const rect = img.getBoundingClientRect();
          return {
            src: img.currentSrc,
            sizes: img.sizes,
            cssWidth: rect.width,
            cssHeight: rect.height,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          };
        });
        const body = await downloads.get(info.src);
        if (!body) throw new Error('No actual browser image response captured');
        const meta = await sharp(body).metadata();
        const record = {
          id,
          kind,
          viewport: viewport.width,
          dpr,
          ...info,
          downloadedWidth: meta.width,
          downloadedHeight: meta.height,
          format: meta.format,
          bytes: body.length,
        };
        if (phase === 'after') {
          if (new URL(info.src).searchParams.get('q') !== '90')
            throw new Error('Wrong image quality');
          if (new URL(info.src).origin !== 'http://localhost:3000')
            throw new Error('Image bypassed server');
          const layout = await image.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            return { ratio: rect.width / rect.height, fit: getComputedStyle(el).objectFit };
          });
          if (Math.abs(layout.ratio - 0.8) > 0.001 || layout.fit !== 'cover')
            throw new Error('Image layout changed');
        }
        measurements.push(record);
        if (dpr === 2)
          await image.screenshot({
            path: `${output}/${phase}-${id}-${kind}-${viewport.width}-2x.png`,
          });
        console.log(JSON.stringify(record));
      }
    }
    if (external.length) throw new Error('Browser made a direct Nazdar request');
    await context.close();
  }
}
await browser.close();
await writeFile(`${output}/${phase}.json`, JSON.stringify(measurements, null, 2) + '\n');
