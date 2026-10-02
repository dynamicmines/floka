import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { photoCandidates } from '../src/lib/nazdar/photo-candidates';
const base = 'https://api.crm.nazdar.kz';
const raw = [];
for (let page = 1; page <= 3; page++) {
  const response = await fetch(`${base}/mobile/menu/?page=${page}&per_page=100`);
  if (!response.ok) throw new Error(`Nazdar HTTP ${response.status}`);
  raw.push(...(await response.json()).results);
}
const sources = [];
for (const id of ['bouquet-4', 'bouquet-111', 'product-24']) {
  const [kind, number] = id.split('-');
  const item = raw.find((item) => item.item_type === kind && item.item_id === Number(number));
  if (!item) throw new Error(`Missing ${id}`);
  const candidates = photoCandidates(item.image, item.sliders);
  const server = await fetch(`http://localhost:3000/api/products/${id}`);
  if (!server.ok) throw new Error(`Flowka HTTP ${server.status}`);
  const selected = (await server.json()).product.imageUrl;
  if (!candidates.includes(selected)) throw new Error('Source absent from actual Nazdar payload');
  for (const url of [...new Set([candidates[0], selected])]) {
    const response = await fetch(url, { redirect: 'error' });
    if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const meta = await sharp(bytes).metadata();
    sources.push({
      id,
      role: url === candidates[0] ? 'primary' : 'selected-slider',
      url,
      width: meta.width,
      height: meta.height,
      format: meta.format,
      bytes: bytes.length,
    });
  }
}
await writeFile('docs/image-quality/sources.json', JSON.stringify(sources, null, 2) + '\n');
console.log(sources);
