import { mkdir, writeFile, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { rawProductSchema, bouquetSchema } from '../src/lib/nazdar/types';
import { isInMvpScope } from '../src/lib/nazdar/normalize';
import { photoCandidates, bestPhoto } from '../src/lib/nazdar/photo-candidates';
const base = 'https://api.crm.nazdar.kz';
const directory = 'docs/image-quality/originals-audit';
const cache = '/private/tmp/flowka-supplier-photos';
await mkdir(directory, { recursive: true });
await mkdir(cache, { recursive: true });
const pause = () => new Promise((resolve) => setTimeout(resolve, 350));
async function json(path: string) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}
const raw = [];
for (let page = 1; page <= 3; page++) {
  const body = await json(`/mobile/menu/?page=${page}&per_page=100`);
  raw.push(...body.results);
  await pause();
}
const menuFields = Object.keys(raw[0]);
const detailFields = new Set<string>();
const products: {
  id: string;
  name: string;
  primary: string | null | undefined;
  candidates: string[];
  excluded: string[];
  detailError: string;
}[] = [];
for (const value of raw) {
  const item = rawProductSchema.parse(value);
  if (!isInMvpScope(item)) continue;
  const candidates = photoCandidates(item.image, item.sliders);
  const excluded = [item.image, ...item.sliders.map((s) => s.slider_image)].filter(
    (url): url is string =>
      typeof url === 'string' && /chatgpt|gemini_generated/i.test(decodeURIComponent(url)),
  );
  products.push({
    id: `${item.item_type}-${item.item_id}`,
    name: item.name,
    primary: item.image,
    candidates,
    excluded,
    detailError: '',
  });
}
let next = 0;
await Promise.all(
  Array.from({ length: 2 }, async () => {
    while (next < products.length) {
      const product = products[next++];
      if (!product.id.startsWith('bouquet-')) continue;
      try {
        const value = await json(`/mobile/bouquets/${product.id.slice(8)}/`);
        Object.keys(value).forEach((key) => detailFields.add(key));
        const detail = bouquetSchema.parse(value);
        product.candidates = [
          ...new Set([
            ...product.candidates,
            ...photoCandidates(detail.preview_image, detail.sliders),
          ]),
        ];
      } catch (error) {
        product.detailError = String(error);
      }
      await pause();
    }
  }),
);
await writeFile(
  `${directory}/inventory.json`,
  JSON.stringify(
    { checkedAt: new Date().toISOString(), menuFields, detailFields: [...detailFields], products },
    null,
    2,
  ) + '\n',
);
const urls = [...new Set(products.flatMap((p) => p.candidates))];
const dimensions = new Map<string, { width: number; height: number } | null>();
next = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (next < urls.length) {
      const index = next++;
      const url = urls[index];
      const filename = `${cache}/${Buffer.from(url).toString('base64url')}`;
      try {
        let bytes: Buffer;
        try {
          if (process.argv.includes('--refresh')) throw new Error('Refresh requested');
          bytes = await readFile(filename);
        } catch {
          const response = await fetch(url, {
            redirect: 'error',
            signal: AbortSignal.timeout(15000),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          bytes = Buffer.from(await response.arrayBuffer());
          await writeFile(filename, bytes);
        }
        const metadata = await sharp(bytes).metadata();
        if (!metadata.width || !metadata.height) throw new Error('Missing dimensions');
        dimensions.set(url, { width: metadata.width, height: metadata.height });
      } catch {
        dimensions.set(url, null);
      }
      if (index % 30 === 0) console.log(`Measured ${index + 1}/${urls.length} sources`);
      await pause();
    }
  }),
);
const results = products.map((product) => {
  const candidates = product.candidates.map((url) => ({
    url,
    dimensions: dimensions.get(url) || null,
  }));
  const selected = bestPhoto(candidates);
  const size = selected ? dimensions.get(selected) : null;
  // Contain preserves the full photograph. Maximum detail frame is 512×640.
  const density = size ? Math.max(size.width / 512, size.height / 640) : 0;
  return {
    ...product,
    candidates,
    selected,
    density,
    adequateDetail2x: density >= 2,
    adequateDetail3x: density >= 3,
  };
});
await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2) + '\n');
await writeFile(
  'src/lib/nazdar/verified-photo-dimensions.json',
  JSON.stringify(Object.fromEntries([...dimensions].filter(([, size]) => size)), null, 2) + '\n',
);
console.log({
  products: results.length,
  sources: urls.length,
  unresolvedDetails: products.filter((p) => p.detailError).length,
  adequateDetail2x: results.filter((p) => p.adequateDetail2x).length,
  adequateDetail3x: results.filter((p) => p.adequateDetail3x).length,
});
