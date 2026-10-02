import { afterEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';
import { photoDisplayLimits, photoImageSizes } from '@/lib/photo-display';
import { bestPhoto, photoCandidates } from '@/lib/nazdar/photo-candidates';
vi.mock('next/cache', () => ({ unstable_cache: (fn: unknown) => fn }));
import { inspectPhoto, mapPhotos, resolvePhoto, getPhotoDimensions } from '@/lib/nazdar/photos';
const primary = 'https://api.crm.nazdar.kz/media/preview/main.jpg';
const slider = 'https://api.crm.nazdar.kz/media/slider/main.jpg';
afterEach(() => vi.unstubAllGlobals());
describe('verified product photo selection', () => {
  it('accepts only supplied still-photo media paths, orders sliders, and removes duplicates', () => {
    expect(
      photoCandidates(primary, [
        { order: 2, slider_image: '/media/slider/video.mp4' },
        { order: 1, slider_image: slider },
        { order: 0, slider_image: primary },
        { order: 3, slider_image: 'https://other.example/media/fake.jpg' },
      ]),
    ).toEqual([primary, slider]);
  });
  it('selects higher usable resolution while preserving the primary on ties', () => {
    expect(
      bestPhoto([
        { url: primary, dimensions: { width: 328, height: 284 } },
        { url: slider, dimensions: { width: 750, height: 1626 } },
      ]),
    ).toBe(slider);
    expect(
      bestPhoto([
        { url: primary, dimensions: { width: 728, height: 1293 } },
        { url: slider, dimensions: { width: 728, height: 1293 } },
      ]),
    ).toBe(primary);
  });
  it('does not select a wide strip that loses resolution in the existing 4:5 crop', () => {
    expect(
      bestPhoto([
        { url: primary, dimensions: { width: 235, height: 294 } },
        { url: slider, dimensions: { width: 1280, height: 198 } },
      ]),
    ).toBe(primary);
  });
  it('retains the supplied primary if all metadata probes fail', () => {
    expect(
      bestPhoto([
        { url: primary, dimensions: null },
        { url: slider, dimensions: null },
      ]),
    ).toBe(primary);
  });
  it('reads actual image bytes and keeps all source requests server-side', async () => {
    const bytes = await sharp({
      create: { width: 750, height: 1626, channels: 3, background: 'white' },
    })
      .jpeg()
      .toBuffer();
    const request = vi
      .fn()
      .mockResolvedValue(
        new Response(new Uint8Array(bytes), { headers: { 'content-type': 'image/jpeg' } }),
      );
    vi.stubGlobal('fetch', request);
    expect(await inspectPhoto(slider)).toEqual({ width: 750, height: 1626 });
    expect(request).toHaveBeenCalledWith(
      slider,
      expect.objectContaining({ redirect: 'error', cache: 'no-store' }),
    );
  });
  it('rejects untrusted URLs without fetching and rejects corrupt or oversized media', async () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    expect(await inspectPhoto('https://other.example/media/photo.jpg')).toBeNull();
    expect(request).not.toHaveBeenCalled();
    request.mockResolvedValueOnce(
      new Response('bad', { headers: { 'content-type': 'image/jpeg' } }),
    );
    expect(await inspectPhoto(primary)).toBeNull();
    request.mockResolvedValueOnce(
      new Response('bad', {
        headers: { 'content-type': 'image/jpeg', 'content-length': '10485761' },
      }),
    );
    expect(await inspectPhoto(primary)).toBeNull();
  });
  it('survives unavailable media and never promotes videos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect(await resolvePhoto(primary, [{ order: 1, slider_image: slider }])).toBe(primary);
    expect(await resolvePhoto('/media/slider/video.mp4')).toBeUndefined();
  });
  it('bounds metadata work to four products while retaining catalog ordering', async () => {
    let active = 0;
    let maximum = 0;
    const result = await mapPhotos([1, 2, 3, 4, 5, 6], async (value) => {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active--;
      return value * 2;
    });
    expect(result).toEqual([2, 4, 6, 8, 10, 12]);
    expect(maximum).toBe(4);
  });
});

it('excludes upstream files explicitly named as generated images', () => {
  expect(
    photoCandidates('/media/preview/ChatGPT_Image.png', [
      { order: 1, slider_image: '/media/slider/Gemini_Generated_Image.jpg' },
    ]),
  ).toEqual([]);
});
it.each([1, 2, 3])('caps image display to real source pixels at %sx density', (density) => {
  const limits = photoDisplayLimits({ width: 330, height: 284 }, density);
  expect(limits.maxWidth * density).toBe(330);
  expect(limits.maxHeight * density).toBe(284);
});
it('does not enlarge a sharp portrait to fill and crop a 4:5 frame', () => {
  expect(photoDisplayLimits({ width: 750, height: 1626 }, 2)).toEqual({
    maxWidth: 375,
    maxHeight: 813,
  });
});

it('sizes the full portrait content and caps requests to the verified source at Retina density', () => {
  const sizes = photoImageSizes('512px', { width: 750, height: 1626 }, 2);
  expect(sizes).toBe('min(295.203px, 375px)');
  expect(photoImageSizes('512px', { width: 330, height: 284 }, 2)).toBe('min(512px, 165px)');
});

it('reuses dimensions measured from the exact supplier file without probing media during checkout', async () => {
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  expect(
    await getPhotoDimensions('https://api.crm.nazdar.kz/media/preview/9H7A9782_NKyBWdP.jpg'),
  ).toEqual({ width: 330, height: 284 });
  expect(request).not.toHaveBeenCalled();
});
