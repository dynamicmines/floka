'use client';
import Image from 'next/image';
import { useState } from 'react';
export function ProductImage({
  src,
  name,
  priority = false,
  sizes = '(max-width: 767px) 50vw, 25vw',
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
      priority={priority}
      className="object-cover"
      onError={() => setBroken(true)}
    />
  );
}
