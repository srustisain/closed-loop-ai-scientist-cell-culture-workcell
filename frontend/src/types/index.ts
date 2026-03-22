export interface WellResult {
  well: string;
  parent_well: string;
  params: Record<string, number>;
  growth_rate: number;
  doubling_time_hours: number | null;
  r_squared: number;
  max_od: number;
  n_datapoints: number;
  time_range_hours: number;
}

export interface IterationMetrics {
  iteration_id: string;
  results: WellResult[];
}

export interface IterationSummary {
  iteration_id: string;
  well_count: number;
  mean_growth_rate: number;
  best_growth_rate: number;
  best_well: string;
}

export interface OdReading {
  elapsed_hours: number;
  od600: number;
}

export interface DesignMapping {
  designs: { well: string; params: Record<string, number> }[];
}

export type MetricKey = 'growth_rate' | 'max_od' | 'r_squared' | 'doubling_time_hours';

export const METRIC_LABELS: Record<MetricKey, string> = {
  growth_rate: 'Growth Rate (1/h)',
  max_od: 'Max OD',
  r_squared: 'R-squared',
  doubling_time_hours: 'Doubling Time (h)',
};
