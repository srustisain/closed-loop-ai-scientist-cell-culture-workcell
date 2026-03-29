/** Sort iteration ids (e.g. iter_002 before iter_010). */
export function sortIterationIds(ids: string[]): string[] {
  return [...ids].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ''), 10) || 0;
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
  });
}
