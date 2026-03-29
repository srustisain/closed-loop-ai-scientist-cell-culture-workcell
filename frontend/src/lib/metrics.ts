import type { IterationMetrics, MetricKey, WellResult } from '@/types';

/** Numeric value for a dashboard metric; doubling time can be null. */
export function getMetricNumericValue(well: WellResult, metric: MetricKey): number | null {
  if (metric === 'doubling_time_hours') {
    const v = well.doubling_time_hours;
    return v != null && Number.isFinite(v) ? v : null;
  }
  const v = well[metric];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Best-performing well for this metric (max for growth/max_od/r², min for doubling time). */
export function bestWellForMetric(
  results: WellResult[],
  metric: MetricKey,
): { well: string; value: number } | null {
  let best: { well: string; value: number } | null = null;
  for (const r of results) {
    const v = getMetricNumericValue(r, metric);
    if (v === null) continue;
    if (!best) {
      best = { well: r.well, value: v };
      continue;
    }
    const better =
      metric === 'doubling_time_hours' ? v < best.value : v > best.value;
    if (better) best = { well: r.well, value: v };
  }
  return best;
}

/**
 * Map a numeric value to [0, 1] where 1 = best performance for coloring.
 * Growth / max OD / R²: higher is better. Doubling time: lower is better.
 */
export function metricGoodness(
  v: number,
  min: number,
  max: number,
  metric: MetricKey,
): number {
  if (max === min) return 0.5;
  if (metric === 'doubling_time_hours') {
    return (max - v) / (max - min);
  }
  return (v - min) / (max - min);
}

/** Arithmetic mean of a metric over wells with valid values. */
export function meanMetricValue(results: WellResult[], metric: MetricKey): number | null {
  const vals: number[] = [];
  for (const r of results) {
    const v = getMetricNumericValue(r, metric);
    if (v !== null) vals.push(v);
  }
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Min/max of a metric across all wells in several iterations (for shared color scale). */
export function globalMetricRange(
  iterations: IterationMetrics[],
  metric: MetricKey,
): { min: number; max: number } {
  const values: number[] = [];
  for (const it of iterations) {
    for (const r of it.results) {
      const v = r[metric as keyof WellResult];
      if (typeof v === 'number' && Number.isFinite(v)) values.push(v);
    }
  }
  if (values.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...values), max: Math.max(...values) };
}
