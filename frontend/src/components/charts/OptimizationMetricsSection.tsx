import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricViolinDistribution } from './MetricViolinDistribution';
import { DASHBOARD_METRICS } from '@/lib/metricDefinitions';
import type { IterationMetrics } from '@/types';

type Props = {
  iterations: IterationMetrics[];
};

/** Distributions per iteration (violins) for each metric. */
export function OptimizationMetricsSection({ iterations }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Detailed view: distribution per iteration</CardTitle>
        <p className="text-xs text-muted-foreground font-normal leading-relaxed">
          One violin per iteration with all wells shown as points. Iteration colors match the Overview
          tab. Diamonds mark the best well per iteration (highest growth rate, max OD, and R²; lowest
          doubling time).
        </p>
      </CardHeader>
      <CardContent className="space-y-10">
        {DASHBOARD_METRICS.map((metric) => (
          <MetricViolinDistribution key={metric} metric={metric} iterations={iterations} />
        ))}
      </CardContent>
    </Card>
  );
}
