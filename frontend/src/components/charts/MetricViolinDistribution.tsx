import { useMemo } from 'react';
import Plot from './Plot';
import { MetricDefinitionButton } from './MetricDefinitionButton';
import { bestWellForMetric, getMetricNumericValue } from '@/lib/metrics';
import { METRIC_LABELS } from '@/types';
import type { IterationMetrics, MetricKey } from '@/types';

type Props = {
  metric: MetricKey;
  /** Same order as iteration order on the x-axis (e.g. sorted by id). */
  iterations: IterationMetrics[];
};

/** Stable pseudo-jitter in [-0.5, 0.5) from strings (deterministic per well). */
function jitter01(a: string, b: string): number {
  let h = 2166136261;
  const s = `${a}\0${b}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 10000) / 10000 - 0.5;
}

/**
 * Pad y-axis so KDE violins, points, and “best well” labels aren’t clipped.
 * Violin shapes extend to the data extrema; Plotly also draws density slightly past
 * min/max, so we add proportional padding plus a small floor when span is tiny.
 */
function paddedYRange(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  const yMin = Math.min(...values);
  const yMax = Math.max(...values);
  const span = yMax - yMin || Math.abs(yMax) * 0.05 || 0.1;
  const mag = Math.max(Math.abs(yMin), Math.abs(yMax), 1e-6);
  const topPad = span * 0.3 + Math.max(mag * 0.02, 0.012);
  const bottomPad = span * 0.18 + Math.max(mag * 0.012, 0.008);
  return [yMin - bottomPad, yMax + topPad];
}

export function MetricViolinDistribution({ metric, iterations }: Props) {
  const chart = useMemo(() => {
    const categoryOrder = iterations.map((i) => i.iteration_id);
    const catIndex = new Map(categoryOrder.map((id, i) => [id, i]));

    const xi: number[] = [];
    const xs: string[] = [];
    const ys: number[] = [];
    const wellIds: string[] = [];
    let omittedNullDoubling = 0;

    for (const it of iterations) {
      const id = it.iteration_id;
      const ix = catIndex.get(id) ?? 0;
      for (const r of it.results) {
        const v = getMetricNumericValue(r, metric);
        if (v === null) {
          if (metric === 'doubling_time_hours') omittedNullDoubling += 1;
          continue;
        }
        xi.push(ix);
        xs.push(id);
        ys.push(v);
        wellIds.push(r.well);
      }
    }

    const bestX: number[] = [];
    const bestY: number[] = [];
    const bestText: string[] = [];

    for (const it of iterations) {
      const best = bestWellForMetric(it.results, metric);
      if (best) {
        bestX.push(catIndex.get(it.iteration_id) ?? 0);
        bestY.push(best.value);
        bestText.push(best.well);
      }
    }

    const allY = [...ys, ...bestY];
    const yRange = paddedYRange(allY);

    // Horizontal jitter for strip (spread dots without leaving the category band)
    const jitterScale = Math.min(0.32, 0.9 / Math.max(8, categoryOrder.length));
    const xJittered = xi.map((i, idx) => i + jitter01(wellIds[idx], xs[idx]!) * jitterScale);

    const emptyNote =
      metric === 'doubling_time_hours' && omittedNullDoubling > 0
        ? `${omittedNullDoubling} well readings omitted (no valid doubling time).`
        : null;

    return {
      xi,
      xs,
      violinY: ys,
      xJittered,
      wellIds,
      bestX,
      bestY,
      bestText,
      yTitle: METRIC_LABELS[metric],
      categoryOrder,
      emptyNote,
      yRange,
      nCats: categoryOrder.length,
    };
  }, [metric, iterations]);

  const hasViolinData = chart.violinY.length > 0;

  if (!hasViolinData) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{METRIC_LABELS[metric]}</span>
          <MetricDefinitionButton metric={metric} />
        </div>
        <p className="text-sm text-muted-foreground">
          {metric === 'doubling_time_hours'
            ? 'No wells with a valid doubling time in these iterations.'
            : 'No numeric data to plot for this metric.'}
        </p>
      </div>
    );
  }

  const tickvals = chart.categoryOrder.map((_, i) => i);

  const data: object[] = [
    {
      type: 'violin' as const,
      x: chart.xi,
      y: chart.violinY,
      name: 'Distribution',
      fillcolor: 'rgba(148, 163, 184, 0.38)',
      line: { color: '#94a3b8', width: 1 },
      box: { visible: false },
      meanline: { visible: false },
      points: false,
      width: 0.72,
      side: 'both' as const,
      hoverinfo: 'skip' as const,
      cliponaxis: false,
      showlegend: true,
    },
    {
      type: 'scatter' as const,
      x: chart.xJittered,
      y: chart.violinY,
      text: chart.wellIds,
      mode: 'markers' as const,
      name: 'Wells',
      marker: {
        size: 6,
        opacity: 0.65,
        color: 'rgba(37, 99, 235, 0.85)',
        line: { width: 0 },
      },
      hovertemplate: '<b>%{text}</b><br>%{y:.4f}<extra></extra>',
      showlegend: true,
    },
    {
      type: 'scatter' as const,
      mode: 'markers+text' as const,
      x: chart.bestX,
      y: chart.bestY,
      text: chart.bestText,
      textposition: 'top center' as const,
      textfont: { size: 11, color: '#0f172a' },
      name: 'Best well',
      marker: {
        color: '#ea580c',
        size: 12,
        symbol: 'diamond',
        line: { width: 1.5, color: '#9a3412' },
      },
      cliponaxis: false,
      hovertemplate: '<b>Best: %{text}</b><br>%{y:.4f}<extra></extra>',
      showlegend: true,
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{METRIC_LABELS[metric]}</span>
        <MetricDefinitionButton metric={metric} />
      </div>
      {chart.emptyNote ? (
        <p className="text-xs text-muted-foreground">{chart.emptyNote}</p>
      ) : null}
      <Plot
        data={data}
        layout={{
          xaxis: {
            title: { text: 'Iteration' },
            type: 'linear',
            tickmode: 'array',
            tickvals,
            ticktext: chart.categoryOrder,
            range: [-0.55, Math.max(chart.nCats - 1, 0) + 0.55],
            zeroline: false,
            gridcolor: '#e5e7eb',
          },
          yaxis: {
            title: { text: chart.yTitle },
            gridcolor: '#e5e7eb',
            range: chart.yRange,
            fixedrange: false,
          },
          margin: { l: 58, r: 12, t: 58, b: 52 },
          height: 300,
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { size: 11 },
          showlegend: true,
          legend: {
            orientation: 'h',
            y: -0.28,
            x: 0,
            xanchor: 'left',
            font: { size: 11 },
          },
          hovermode: 'closest' as const,
        }}
        config={{ displayModeBar: false, responsive: true }}
        useResizeHandler
        style={{ width: '100%' }}
      />
    </div>
  );
}
