/** Distinct, colorblind-friendly-ish palette for iteration series in charts. */
const PALETTE = [
  '#2563eb',
  '#16a34a',
  '#c026d3',
  '#ea580c',
  '#0891b2',
  '#ca8a04',
  '#7c3aed',
  '#dc2626',
  '#0d9488',
  '#4f46e5',
] as const;

export function colorForIterationIndex(index: number): string {
  return PALETTE[index % PALETTE.length]!;
}

export function colorForIterationId(iterationId: string, orderedIds: string[]): string {
  const i = orderedIds.indexOf(iterationId);
  return colorForIterationIndex(i >= 0 ? i : 0);
}

/** For violin fills / translucent overlays (palette is hex). */
export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
