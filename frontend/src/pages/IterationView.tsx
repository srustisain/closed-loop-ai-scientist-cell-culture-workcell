import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlateHeatmap } from '@/components/plate/PlateHeatmap';
import { WellDetailPanel } from '@/components/plate/WellDetailPanel';
import { MetricDefinitionButton } from '@/components/charts/MetricDefinitionButton';
import { useIteration } from '@/api/client';
import { ApiErrorState } from '@/components/feedback/ApiErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { bestWellForMetric, meanMetricValue } from '@/lib/metrics';
import type { MetricKey } from '@/types';
import { METRIC_LABELS } from '@/types';

export function IterationView() {
  const { iterationId } = useParams<{ iterationId: string }>();
  const { data: iteration, isLoading, error, refetch } = useIteration(iterationId ?? '');
  const [selectedWell, setSelectedWell] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>('growth_rate');

  const selectedWellData = useMemo(() => {
    if (!selectedWell || !iteration) return null;
    return iteration.results.find((r) => r.well === selectedWell) ?? null;
  }, [selectedWell, iteration]);

  const bestForMetric = useMemo(() => {
    if (!iteration) return null;
    return bestWellForMetric(iteration.results, metric);
  }, [iteration, metric]);

  const meanForMetric = useMemo(() => {
    if (!iteration) return null;
    return meanMetricValue(iteration.results, metric);
  }, [iteration, metric]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <ApiErrorState
        message={(error as Error).message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!iteration) {
    return (
      <EmptyState
        title="Iteration"
        description="No data found for this iteration. Check the URL or ensure the parser has run."
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Iteration: {iteration.iteration_id}</h2>

      {/* Summary stats (follow selected metric) */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="text-muted-foreground">
          Wells: <span className="text-foreground font-medium">{iteration.results.length}</span>
        </span>
        <span className="text-muted-foreground">
          Best ({METRIC_LABELS[metric]}):{' '}
          <span className="text-foreground font-medium">
            {bestForMetric ? (
              <>
                well {bestForMetric.well} ({bestForMetric.value.toFixed(4)})
              </>
            ) : (
              '—'
            )}
          </span>
        </span>
        <span className="text-muted-foreground">
          Mean ({METRIC_LABELS[metric]}):{' '}
          <span className="text-foreground font-medium">
            {meanForMetric != null ? meanForMetric.toFixed(4) : '—'}
          </span>
        </span>
      </div>

      {/* Plate + well detail: controls sit directly above the heatmap */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <Card className="min-w-0 flex-1">
          <CardHeader className="space-y-3 border-b border-border/60 pb-4">
            <div>
              <CardTitle className="text-base">Well plate</CardTitle>
              <CardDescription>
                Choose which metric sets the blue scale. Darker wells are better for that metric
                (see legend below the grid).
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="text-sm font-medium text-foreground">Color by</span>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
                  <SelectTrigger className="w-[min(100%,18rem)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {METRIC_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <MetricDefinitionButton metric={metric} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <PlateHeatmap
              results={iteration.results}
              metric={metric}
              selectedWell={selectedWell}
              onSelectWell={setSelectedWell}
            />
          </CardContent>
        </Card>

        {selectedWellData && (
          <WellDetailPanel
            well={selectedWellData}
            iterationId={iteration.iteration_id}
            onClose={() => setSelectedWell(null)}
          />
        )}
      </div>
    </div>
  );
}
