/**
 * Map a Plotly legend click to an iteration id when the trace is an iteration series
 * (not "Best per …" helper traces, not showlegend:false overlays).
 */
export function iterationIdFromLegendClick(
  traces: object[],
  curveNumber: number,
  validIterationIds: string[],
): string | null {
  const t = traces[curveNumber] as { name?: string; showlegend?: boolean } | undefined;
  if (!t || t.showlegend === false) return null;
  const name = t.name;
  if (!name) return null;
  if (name === 'Best per iteration (by Y)' || name === 'Best per iteration') return null;
  if (validIterationIds.includes(name)) return name;
  return null;
}
