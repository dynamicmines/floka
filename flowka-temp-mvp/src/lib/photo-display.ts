export function photoDisplayLimits(size: { width: number; height: number }, density: number) {
  // One original image pixel per physical screen pixel; never synthesize missing resolution.
  const dpr = Number.isFinite(density) && density > 0 ? density : 1;
  return { maxWidth: size.width / dpr, maxHeight: size.height / dpr };
}

export function photoImageSizes(
  frameSizes: string,
  size: { width: number; height: number },
  density: number,
  frameAspect = 4 / 5,
) {
  const scale = Math.min(1, size.width / size.height / frameAspect);
  const cap = photoDisplayLimits(size, density).maxWidth;
  return frameSizes
    .split(',')
    .map((entry) =>
      entry.trim().replace(/(calc\([^)]*\)|[\d.]+px)$/, (value) => {
        const scaled = value.replace(
          /([\d.]+)(vw|px)/g,
          (_, amount: string, unit: string) =>
            `${Number((Number(amount) * scale).toFixed(4))}${unit}`,
        );
        return `min(${scaled}, ${Number(cap.toFixed(4))}px)`;
      }),
    )
    .join(', ');
}
