import { readFile, writeFile } from 'node:fs/promises';
const directory = 'docs/image-quality/originals-audit';
type Result = {
  id: string;
  name: string;
  primary?: string;
  candidates: { url: string; dimensions: { width: number; height: number } | null }[];
  selected?: string;
  density: number;
  adequateDetail2x: boolean;
  adequateDetail3x: boolean;
  excluded: string[];
};
const results: Result[] = JSON.parse(await readFile(`${directory}/results.json`, 'utf8'));
const csv = [
  [
    'Product ID',
    'Product name',
    'Verified best source URL',
    'Source dimensions',
    'Full-frame detail 2x',
    'Full-frame detail 3x',
    'Minimum original dimensions for full-photo detail 3x',
    'Supplier file to obtain',
  ],
];
const rows = [];
for (const product of results) {
  const size = product.candidates.find((c) => c.url === product.selected)?.dimensions;
  const filename =
    decodeURIComponent(
      new URL(product.selected || product.primary || 'https://api.crm.nazdar.kz/').pathname,
    )
      .split('/')
      .pop() || '(no source)';
  const required =
    size && product.density
      ? `${Math.ceil((size.width * 3) / product.density)}×${Math.ceil((size.height * 3) / product.density)}`
      : '1536×1920';
  const request =
    product.excluded.length && !size
      ? 'Genuine camera original of this exact SKU; generated-named source excluded'
      : `Full-resolution camera original corresponding to ${filename}`;
  csv.push([
    product.id,
    product.name,
    product.selected || '',
    size ? `${size.width}×${size.height}` : 'None verified',
    product.adequateDetail2x ? 'Adequate' : 'Original needed',
    product.adequateDetail3x ? 'Adequate' : 'Original needed',
    required,
    request,
  ]);
  if (!product.adequateDetail3x)
    rows.push(
      `| ${product.id} | ${product.name.replaceAll('|', '/')} | ${size ? `${size.width}×${size.height}` : 'None verified'} | ${product.adequateDetail2x ? 'Yes' : 'No'} | ${required} | ${filename.replaceAll('|', '/')} |`,
    );
}
await writeFile(
  `${directory}/supplier-originals-request.csv`,
  csv.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n') +
    '\n',
);
await writeFile(
  `${directory}/SUPPLIER_REQUEST.md`,
  `# Exact supplier originals required\n\nThe live catalog audit covers ${results.length} in-scope products and all 179 bouquet detail responses. ${results.filter((p) => !p.adequateDetail2x).length} products need larger genuine originals to fill the intended desktop detail view at 2×, and ${results.filter((p) => !p.adequateDetail3x).length} need them at 3×. The current app avoids enlargement by displaying smaller photos at their available physical pixel dimensions; that is not a substitute for obtaining originals.\n\nPlease supply the original camera photograph matching each exact product ID and the referenced existing file. No similar bouquets, video frames, AI-generated replacements or upscaled previews. Prefer a product-centered composition with the whole bouquet/toy visible. These minimum dimensions preserve each photo's native aspect ratio when contained inside the largest existing 512×640 CSS-pixel detail frame at 3×. A suitably framed 1536×1920 portrait is an alternative. Larger files must contain real additional detail, not interpolated pixels.\n\nThe requested files are not guessed URLs. Filenames below identify existing supplier assets whose genuine full-resolution originals must be provided. The CSV includes exact supplied source URLs and all products, including the one already adequate at 3×.\n\nBouquet 202 (🤍 Букет «Первый звонок») and bouquet 209 (Букет «Для первого учителя») have only files explicitly named ChatGPT/Gemini-generated in the inspected fields; these are excluded pending genuine camera photographs. A filename is a provenance warning, not independent forensic proof about every image. Other included stills are associated with their exact SKU by Nazdar; no independent camera-original provenance is asserted where the supplier has not provided it.\n\n| Product ID | Product name | Best verified dimensions | Adequate at 2× | Minimum original at 3× | Existing file whose original is needed |\n|---|---|---:|---|---:|---|\n${rows.join('\n')}\n`,
);
console.log({
  requested2x: results.filter((p) => !p.adequateDetail2x).length,
  requested3x: rows.length,
});
