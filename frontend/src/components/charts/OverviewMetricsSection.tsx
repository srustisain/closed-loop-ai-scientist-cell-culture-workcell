import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MetricPairOverview } from './MetricPairOverview';
import { DASHBOARD_METRICS } from '@/lib/metricDefinitions';
import type { IterationMetrics } from '@/types';
import type { MetricKey } from '@/types';
import { METRIC_LABELS } from '@/types';

type Props = {
  iterations: IterationMetrics[];
};

/** Default: biomass (x) vs growth rate (y) — trade-off view. */
const DEFAULT_X: MetricKey = 'max_od';
const DEFAULT_Y: MetricKey = 'growth_rate';

export function OverviewMetricsSection({ iterations }: Props) {
  const [xMetric, setXMetric] = useState<MetricKey>(DEFAULT_X);
  const [yMetric, setYMetric] = useState<MetricKey>(DEFAULT_Y);

  const setX = (v: MetricKey) => {
    setXMetric(v);
    if (v === yMetric) {
      const alt = DASHBOARD_METRICS.find((m) => m !== v);
      if (alt) setYMetric(alt);
    }
  };

  const setY = (v: MetricKey) => {
    setYMetric(v);
    if (v === xMetric) {
      const alt = DASHBOARD_METRICS.find((m) => m !== v);
      if (alt) setXMetric(alt);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Overview: metric pair</CardTitle>
        <p className="text-xs text-muted-foreground font-normal leading-relaxed">
          Each point is one well; horizontal and vertical axes are real metrics. Color matches
          iteration (same palette as Detailed view). Diamonds mark the best well per iteration using
          the <span className="font-medium text-foreground">vertical (Y)</span> metric only.
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="overview-x-metric" className="text-xs text-muted-foreground">
              Horizontal (X)
            </label>
            <Select value={xMetric} onValueChange={(v) => setX(v as MetricKey)}>
              <SelectTrigger id="overview-x-metric" className="w-[min(100%,220px)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_METRICS.map((m) => (
                  <SelectItem key={m} value={m} disabled={m === yMetric}>
                    {METRIC_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="overview-y-metric" className="text-xs text-muted-foreground">
              Vertical (Y)
            </label>
            <Select value={yMetric} onValueChange={(v) => setY(v as MetricKey)}>
              <SelectTrigger id="overview-y-metric" className="w-[min(100%,220px)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_METRICS.map((m) => (
                  <SelectItem key={m} value={m} disabled={m === xMetric}>
                    {METRIC_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MetricPairOverview iterations={iterations} xMetric={xMetric} yMetric={yMetric} />
      </CardContent>
    </Card>
  );
}
