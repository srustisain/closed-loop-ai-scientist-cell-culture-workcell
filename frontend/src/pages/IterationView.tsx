import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PlateHeatmap } from '@/components/plate/PlateHeatmap';
import { WellDetailPanel } from '@/components/plate/WellDetailPanel';
import { useIteration } from '@/api/client';
import { ApiErrorState } from '@/components/feedback/ApiErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-52" />
        </div>
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-[420px] w-full max-w-3xl" />
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Iteration: {iteration.iteration_id}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Color by:</span>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex gap-6 text-sm">
        <span className="text-muted-foreground">
          Wells: <span className="text-foreground font-medium">{iteration.results.length}</span>
        </span>
        <span className="text-muted-foreground">
          Best growth rate:{' '}
          <span className="text-foreground font-medium">
            {Math.max(...iteration.results.map((r) => r.growth_rate)).toFixed(4)} /h
          </span>
        </span>
        <span className="text-muted-foreground">
          Mean growth rate:{' '}
          <span className="text-foreground font-medium">
            {(iteration.results.reduce((s, r) => s + r.growth_rate, 0) / iteration.results.length).toFixed(4)} /h
          </span>
        </span>
      </div>

      {/* Main content: plate + detail panel */}
      <div className="flex gap-6">
        <div className="flex-1">
          <PlateHeatmap
            results={iteration.results}
            metric={metric}
            selectedWell={selectedWell}
            onSelectWell={setSelectedWell}
          />
        </div>

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
