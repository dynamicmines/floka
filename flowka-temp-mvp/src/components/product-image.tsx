'use client';
import Image from 'next/image';
import { useState } from 'react';
import { catalogImageSizes } from '@/lib/image-sizes';
export function ProductImage({
  src,
  name,
  priority = false,
  sizes = catalogImageSizes,
}: {
  src?: string;
  name: string;
  priority?: boolean;
  sizes?: string;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <Image
      src={broken || !src ? '/flower-placeholder.svg' : src}
      alt={name}
      fill
      sizes={sizes}
      quality={90}
      priority={priority}
      className="object-cover"
      onError={() => setBroken(true)}
    />
  );
}
