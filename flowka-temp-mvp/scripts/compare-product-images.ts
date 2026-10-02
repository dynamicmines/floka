import sharp from 'sharp';
const directory = 'docs/image-quality';
for (const [id, kind, viewport] of [
  ['bouquet-111', 'catalog', 1440],
  ['bouquet-111', 'detail', 390],
  ['bouquet-4', 'detail', 390],
  ['product-24', 'catalog', 1440],
] as const) {
  const name = `${id}-${kind}-${viewport}-2x`;
  const before = `${directory}/before-${name}.png`;
  const after = `${directory}/after-${name}.png`;
  const a = await sharp(before).metadata();
  const b = await sharp(after).metadata();
  const width = a.width! + b.width! + 16;
  const height = Math.max(a.height!, b.height!) + 56;
  const labels = Buffer.from(
    `<svg width="${width}" height="56"><rect width="100%" height="100%" fill="white"/><g font-family="sans-serif" font-size="24" fill="#222"><text x="12" y="36">Before · 2× Retina</text><text x="${a.width! + 28}" y="36">After · 2× Retina</text></g></svg>`,
  );
  // Place the unmodified browser screenshots side by side at their native pixel dimensions.
  await sharp({ create: { width, height, channels: 4, background: 'white' } })
    .composite([
      { input: labels, left: 0, top: 0 },
      { input: before, left: 0, top: 56 },
      { input: after, left: a.width! + 16, top: 56 },
    ])
    .png()
    .toFile(`${directory}/comparison-${name}.png`);
}
