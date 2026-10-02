import 'server-only';
import sharp from 'sharp';
import verifiedDimensions from './verified-photo-dimensions.json';
import { unstable_cache } from 'next/cache';
import { bestPhoto, photoCandidates, type PhotoDimensions, type Slider } from './photo-candidates';
const maximumBytes = 10 * 1024 * 1024;
export async function inspectPhoto(url: string): Promise<PhotoDimensions | null> {
  if (photoCandidates(url)[0] !== url) return null;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    if (
      !response.ok ||
      !response.headers.get('content-type')?.startsWith('image/') ||
      Number(response.headers.get('content-length') || 0) > maximumBytes ||
      !response.body
    )
      return null;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximumBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const metadata = await sharp(Buffer.concat(chunks), {
      limitInputPixels: 40_000_000,
    }).metadata();
    if (!metadata.width || !metadata.height || (metadata.pages || 1) > 1) return null;
    const rotated =
      metadata.orientation === 5 ||
      metadata.orientation === 6 ||
      metadata.orientation === 7 ||
      metadata.orientation === 8;
    return {
      width: rotated ? metadata.height : metadata.width,
      height: rotated ? metadata.width : metadata.height,
    };
  } catch {
    return null;
  }
}
// Only small metadata is cached, never full binary photos. The Next image optimizer delivers them.
export const getPhotoDimensions = unstable_cache(
  async (url: string) => {
    // Reuse this audit's measured metadata only for the exact supplied URL, not inferred paths.
    // Refresh the manifest with audit-supplier-photos when supplier files are replaced in place.
    const known = (verifiedDimensions as Record<string, PhotoDimensions>)[url];
    return known || inspectPhoto(url);
  },
  ['nazdar-photo-dimensions-v2-verified'],
  { revalidate: 3600 },
);
export async function resolvePhoto(primary?: string | null, sliders: Slider[] = []) {
  const candidates = photoCandidates(primary, sliders);
  if (candidates.length < 2) return candidates[0];
  const inspected = [];
  // Keep media probes sequential per product and bounded across catalog products.
  for (const url of candidates) inspected.push({ url, dimensions: await getPhotoDimensions(url) });
  return bestPhoto(inspected);
}
export async function mapPhotos<T, R>(items: T[], map: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await map(items[index]);
      }
    }),
  );
  return results;
}

export async function resolveProductPhoto(primary?: string | null, sliders: Slider[] = []) {
  const imageUrl = await resolvePhoto(primary, sliders);
  const imageDimensions = imageUrl ? (await getPhotoDimensions(imageUrl)) || undefined : undefined;
  return { imageUrl, imageDimensions };
}
