import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlateHeatmap } from '@/components/plate/PlateHeatmap';
import { MetricDefinitionButton } from '@/components/charts/MetricDefinitionButton';
import { useIterations, useIterationsBatch } from '@/api/client';
import { bestWellForMetric, globalMetricRange } from '@/lib/metrics';
import { ApiErrorState } from '@/components/feedback/ApiErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import type { MetricKey } from '@/types';
import { METRIC_LABELS } from '@/types';

export function Compare() {
  const { data: summaries, isLoading: listLoading, error: listError, refetch: refetchList } =
    useIterations();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [metric, setMetric] = useState<MetricKey>('growth_rate');
  const initRef = useRef(false);

  useEffect(() => {
    if (summaries?.length && !initRef.current) {
      initRef.current = true;
      setSelectedIds(summaries.map((s) => s.iteration_id));
    }
  }, [summaries]);

  const batch = useIterationsBatch(selectedIds);
  const loaded = useMemo(
    () => batch.map((q) => q.data).filter((d): d is NonNullable<typeof d> => d != null),
    [batch],
  );

  const colorRange = useMemo(() => globalMetricRange(loaded, metric), [loaded, metric]);

  const anyLoading = batch.some((q) => q.isLoading);
  const firstError = batch.find((q) => q.error)?.error;

  const toggleId = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  if (listLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-36 w-full max-w-3xl rounded-xl" />
      </div>
    );
  }

  if (listError) {
    return (
      <ApiErrorState
        message={(listError as Error).message}
        onRetry={() => {
          void refetchList();
        }}
      />
    );
  }

  if (!summaries?.length) {
    return (
      <EmptyState
        title="Compare"
        description="No iterations to compare. Generate mock data or run an experiment first."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Compare iterations</h2>

      <Card className="max-w-3xl">
        <CardHeader className="space-y-3 border-b border-border/60 pb-4">
          <div>
            <CardTitle className="text-base">Metric & color scale</CardTitle>
            <CardDescription>
              One shared blue scale across all visible plates for the selected metric (same as the
              iteration page). Darker wells are better for that metric. Toggle which iterations to
              include below, then scroll horizontally to compare.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="text-sm font-medium text-foreground">Color by</span>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={metric}
                onValueChange={(v) => {
                  if (v) setMetric(v as MetricKey);
                }}
              >
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
      </Card>

      {/* Iteration toggles */}
      <div className="flex flex-wrap gap-4">
        {summaries.map((s) => (
          <label key={s.iteration_id} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedIds.includes(s.iteration_id)}
              onCheckedChange={(c) => toggleId(s.iteration_id, c === true)}
            />
            <span className="font-medium">{s.iteration_id}</span>
            <span className="text-muted-foreground">
              (best {s.best_growth_rate.toFixed(3)} /h)
            </span>
          </label>
        ))}
      </div>

      {selectedIds.length === 0 && (
        <p className="text-sm text-muted-foreground">Select at least one iteration above.</p>
      )}

      {firstError ? (
        <ApiErrorState
          title="Error loading one or more iterations"
          message={(firstError as Error).message}
        />
      ) : null}

      {selectedIds.length > 0 && anyLoading && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {selectedIds.map((id) => (
            <Card key={id} className="min-w-[280px] shrink-0">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">{id}</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[340px] w-[260px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedIds.length > 0 && !anyLoading && loaded.length === 0 && !firstError && (
        <p className="text-sm text-muted-foreground">Could not load iteration data.</p>
      )}

      {selectedIds.length > 0 && !anyLoading && loaded.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {batch.map((q) => {
            const data = q.data;
            if (!data) return null;
            const best = bestWellForMetric(data.results, metric);
            return (
              <Card key={data.iteration_id} className="min-w-[280px] shrink-0">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">{data.iteration_id}</CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    {data.results.length} wells
                    {best ? (
                      <>
                        {' '}
                        · best {best.well} ({best.value.toFixed(4)})
                      </>
                    ) : null}
                  </p>
                </CardHeader>
                <CardContent className="pt-0 overflow-x-auto">
                  <PlateHeatmap
                    results={data.results}
                    metric={metric}
                    selectedWell={null}
                    onSelectWell={() => {}}
                    colorRange={colorRange}
                    compact
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
