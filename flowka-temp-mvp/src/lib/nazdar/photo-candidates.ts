import { imageUrl } from './normalize';
export type PhotoDimensions = { width: number; height: number };
export type Slider = { order: number; slider_image: string };
export function photoUrl(path?: string | null) {
  const url = imageUrl(path);
  return url && /\.(?:jpe?g|png|webp|avif)$/i.test(new URL(url).pathname) ? url : undefined;
}
export function photoCandidates(primary?: string | null, sliders: Slider[] = []) {
  return [
    ...new Set(
      [primary, ...[...sliders].sort((a, b) => a.order - b.order).map((s) => s.slider_image)]
        .map(photoUrl)
        .filter((url): url is string => !!url),
    ),
  ];
}
export function bestPhoto(candidates: { url: string; dimensions: PhotoDimensions | null }[]) {
  // Resolution remaining after the existing 4:5 object-cover crop matters more than area.
  // Ties retain the primary photo and its current framing.
  let best = candidates[0]?.url;
  let score = 0;
  for (const candidate of candidates) {
    const size = candidate.dimensions;
    if (!size) continue;
    const nextScore = Math.min(size.width, (size.height * 4) / 5);
    if (nextScore > score) {
      best = candidate.url;
      score = nextScore;
    }
  }
  return best;
}
