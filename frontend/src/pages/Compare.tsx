import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlateHeatmap } from '@/components/plate/PlateHeatmap';
import { useIterations, useIterationsBatch } from '@/api/client';
import { globalMetricRange } from '@/lib/metrics';
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full max-w-2xl" />
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Compare iterations</h2>
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

      <p className="text-sm text-muted-foreground max-w-3xl">
        Plates use one shared color scale for the selected metric so you can compare across runs.
        Choose which iterations to show, then scroll horizontally if needed.
      </p>

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
            return (
              <Card key={data.iteration_id} className="min-w-[280px] shrink-0">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">{data.iteration_id}</CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    {data.results.length} wells · best{' '}
                    {Math.max(...data.results.map((r) => r.growth_rate)).toFixed(4)} /h
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
