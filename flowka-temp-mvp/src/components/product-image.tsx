'use client';
import Image from 'next/image';
import { useState, useSyncExternalStore } from 'react';
import { photoDisplayLimits, photoImageSizes } from '@/lib/photo-display';
import { photoUrl } from '@/lib/nazdar/photo-candidates';
import { catalogImageSizes } from '@/lib/image-sizes';
export function ProductImage({
  src,
  dimensions,
  frameAspect = 4 / 5,
  name,
  priority = false,
  sizes = catalogImageSizes,
}: {
  src?: string;
  dimensions?: { width: number; height: number };
  frameAspect?: number;
  name: string;
  priority?: boolean;
  sizes?: string;
}) {
  const verifiedSrc = photoUrl(src);
  const [broken, setBroken] = useState(false);
  const density = useSyncExternalStore(subscribeToDensity, browserDensity, () => 2);
  const limits =
    !broken && verifiedSrc && dimensions ? photoDisplayLimits(dimensions, density) : undefined;
  return (
    <Image
      src={broken || !verifiedSrc ? '/flower-placeholder.svg' : verifiedSrc}
      alt={name}
      fill
      sizes={
        !broken && verifiedSrc && dimensions
          ? photoImageSizes(sizes, dimensions, density, frameAspect)
          : sizes
      }
      quality={90}
      priority={priority}
      className={verifiedSrc && !dimensions ? 'object-scale-down' : 'object-contain'}
      style={limits ? { ...limits, margin: 'auto' } : undefined}
      onError={() => setBroken(true)}
    />
  );
}

function browserDensity() {
  return window.devicePixelRatio || 1;
}
function subscribeToDensity(update: () => void) {
  window.addEventListener('resize', update);
  const query = window.matchMedia(`(resolution: ${browserDensity()}dppx)`);
  query.addEventListener('change', update);
  return () => {
    window.removeEventListener('resize', update);
    query.removeEventListener('change', update);
  };
}
