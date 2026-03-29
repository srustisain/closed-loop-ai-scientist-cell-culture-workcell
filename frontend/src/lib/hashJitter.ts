/** Stable pseudo-jitter in [-0.5, 0.5) from strings (deterministic per point). */
export function jitter01(a: string, b: string): number {
  let h = 2166136261;
  const s = `${a}\0${b}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 10000) / 10000 - 0.5;
}
