import type { MetricKey } from '@/types';

/** Metrics shown on the dashboard optimization section (order matters). */
export const DASHBOARD_METRICS = [
  'growth_rate',
  'max_od',
  'r_squared',
  'doubling_time_hours',
] as const satisfies readonly MetricKey[];

/** Short, user-facing definitions aligned with parser / scientific usage. */
export const METRIC_HELP: Record<MetricKey, string> = {
  growth_rate:
    'Specific growth rate μ (1/h): slope of ln(OD) vs time during exponential phase. Higher means faster cell division. Primary target for optimization.',
  max_od:
    'Peak OD600 observed during the valid data window. Higher usually means more biomass produced in the well. Useful as a secondary objective alongside growth rate.',
  r_squared:
    'Quality of the exponential fit (0–1). Values near 1 indicate the growth curve followed exponential kinetics; low values suggest noisy data, lag phase, or a poor fit.',
  doubling_time_hours:
    'Time for the population to double: ln(2)/μ when growth rate μ > 0. Lower is faster growth. May be missing for wells with no detectable exponential growth.',
};
