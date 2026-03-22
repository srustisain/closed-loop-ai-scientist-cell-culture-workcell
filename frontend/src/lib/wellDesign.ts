/**
 * Human-readable labels for design-parameter keys from well_to_design_mapping / parser output.
 * Unknown keys fall back to a readable transformation of the key name.
 */
export const DESIGN_PARAM_LABELS: Record<string, string> = {
  cell_volume_uL: 'Cell volume',
  mix_height_mm: 'Mix height',
  mix_reps: 'Mix reps',
};

function fallbackLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\buL\b/i, 'µL');
}

function formatParamValue(key: string, v: number): string {
  if (!Number.isFinite(v)) return String(v);
  const rounded = Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v.toFixed(1);
  if (key.includes('uL') || key.endsWith('_uL')) return `${rounded} µL`;
  if (key.includes('mm')) return `${rounded} mm`;
  if (key.includes('reps')) return `${rounded} reps`;
  return rounded;
}

export type DesignParamEntry = {
  key: string;
  label: string;
  display: string;
};

/** Ordered entries for display (stable ordering for known keys). */
export function designParamEntries(params: Record<string, number> | null | undefined): DesignParamEntry[] {
  if (!params || Object.keys(params).length === 0) return [];
  const order = ['cell_volume_uL', 'mix_height_mm', 'mix_reps'];
  const keys = Object.keys(params);
  const sorted = [
    ...order.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !order.includes(k)).sort(),
  ];
  return sorted.map((key) => ({
    key,
    label: DESIGN_PARAM_LABELS[key] ?? fallbackLabel(key),
    display: formatParamValue(key, params[key]!),
  }));
}

/** One line for summaries and inline text (e.g. "32.6 µL · 1.7 mm · 4 reps"). */
export function formatDesignParamsInline(params: Record<string, number> | null | undefined): string {
  const entries = designParamEntries(params);
  if (entries.length === 0) return '';
  return entries.map((e) => `${e.label}: ${e.display}`).join(' · ');
}

/** Plotly hover HTML (uses <br>). */
export function formatDesignParamsPlotlyHtml(params: Record<string, number> | null | undefined): string {
  const entries = designParamEntries(params);
  if (entries.length === 0) return '<b>Experimental design</b><br><i>No parameters</i>';
  return (
    '<b>Experimental design</b><br>' +
    entries.map((e) => `<b>${e.label}</b><br>${e.display}`).join('<br><br>')
  );
}
