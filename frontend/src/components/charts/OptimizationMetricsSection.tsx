import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricViolinDistribution } from './MetricViolinDistribution';
import { DASHBOARD_METRICS } from '@/lib/metricDefinitions';
import type { IterationMetrics } from '@/types';

type Props = {
  iterations: IterationMetrics[];
};

/** Per-iteration distributions (all wells) plus best-well markers for each dashboard metric. */
export function OptimizationMetricsSection({ iterations }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Optimization progress</CardTitle>
        <p className="text-xs text-muted-foreground font-normal leading-relaxed">
          Each blue dot is one well (jittered so overlaps are visible). Hover a dot for its value. The
          shaded shape is the overall distribution; orange diamonds mark the best well per iteration
          (highest growth rate, max OD, and R²; lowest doubling time).
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
