import { useMemo } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { bestWellForMetric, getMetricNumericValue, metricGoodness } from '@/lib/metrics';
import { WellIdWithDesign } from '@/components/wells/WellIdWithDesign';
import {
  invertedTip,
  WellDesignParamList,
  WellTooltipSection,
} from '@/components/wells/wellTooltipContent';
import type { WellResult, MetricKey } from '@/types';
import { METRIC_LABELS } from '@/types';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const COLS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Single-hue sequential scale: light (low goodness) → saturated dark (high goodness). */
function sequentialFill(goodness: number): string {
  const t = Math.min(1, Math.max(0, goodness));
  const h = 221;
  const s = 18 + t * 62;
  const l = 94 - t * 54;
  return `hsl(${h} ${s}% ${l}%)`;
}

function gradientStops(): string {
  const steps = 12;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    parts.push(`${sequentialFill(t)} ${(t * 100).toFixed(1)}%`);
  }
  return `linear-gradient(to right, ${parts.join(', ')})`;
}

interface Props {
  results: WellResult[];
  metric: MetricKey;
  selectedWell: string | null;
  onSelectWell: (well: string) => void;
  /** When set, wells are colored using this range (e.g. across multiple iterations). */
  colorRange?: { min: number; max: number };
  /** Smaller wells for side-by-side compare view. */
  compact?: boolean;
  /** Show ring + callout for the best well on the plate (for this metric). Default true. */
  showBestHighlight?: boolean;
}

export function PlateHeatmap({
  results,
  metric,
  selectedWell,
  onSelectWell,
  colorRange: colorRangeProp,
  compact = false,
  showBestHighlight = true,
}: Props) {
  const wellMap = useMemo(() => {
    const map = new Map<string, WellResult>();
    for (const r of results) map.set(r.well, r);
    return map;
  }, [results]);

  const localRange = useMemo(() => {
    const values = results
      .map((r) => getMetricNumericValue(r, metric))
      .filter((v): v is number => v !== null);
    if (values.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [results, metric]);

  const { min, max } = colorRangeProp ?? localRange;

  const bestOnPlate = useMemo(
    () => (showBestHighlight ? bestWellForMetric(results, metric) : null),
    [results, metric, showBestHighlight],
  );

  const cell = compact ? 'w-6 h-6 mx-0.5' : 'w-9 h-9 mx-0.5';
  const colW = compact ? 'w-6' : 'w-10';
  const rowLabel = compact ? 'w-6 text-[10px]' : 'w-8';
  const ml = compact ? 'ml-6' : 'ml-8';

  const legendLowHigh =
    metric === 'doubling_time_hours'
      ? { low: 'Slower growth', high: 'Faster growth' }
      : { low: 'Lower', high: 'Higher' };

  return (
    <div className="inline-block">
      {/* Column headers */}
      <div className={`flex ${ml} mb-1`}>
        {COLS.map((col) => (
          <div
            key={col}
            className={`${colW} text-center ${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground font-medium`}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Plate grid */}
      {ROWS.map((row) => (
        <div key={row} className="flex items-center mb-1">
          <div
            className={`${rowLabel} ${compact ? '' : 'text-xs'} text-muted-foreground font-medium text-right pr-2`}
          >
            {row}
          </div>
          {COLS.map((col) => {
            const wellId = `${row}${col}`;
            const well = wellMap.get(wellId);
            const value = well ? getMetricNumericValue(well, metric) : null;
            const goodness = value !== null ? metricGoodness(value, min, max, metric) : null;
            const color =
              value !== null && goodness !== null ? sequentialFill(goodness) : 'hsl(220 10% 92%)';
            const isSelected = wellId === selectedWell;
            const isBest = Boolean(bestOnPlate && wellId === bestOnPlate.well && value !== null);

            return (
              <Tooltip key={wellId}>
                <TooltipTrigger
                  render={(props) => (
                    <div
                      {...props}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        cell,
                        'rounded-full border-2 transition-all cursor-pointer',
                        isBest && !isSelected && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background',
                        isSelected
                          ? 'border-foreground scale-110 shadow-md z-[1]'
                          : 'border-transparent hover:border-muted-foreground/50 hover:scale-105',
                        props.className,
                      )}
                      style={{ ...props.style, backgroundColor: color }}
                      aria-label={
                        isBest
                          ? `${wellId}, best on plate for this metric${value != null ? `, ${value}` : ''}`
                          : wellId
                      }
                      onClick={(e) => {
                        props.onClick?.(e);
                        onSelectWell(wellId);
                      }}
                      onKeyDown={(e) => {
                        props.onKeyDown?.(e);
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectWell(wellId);
                        }
                      }}
                    />
                  )}
                />
                <TooltipContent side="top" className="px-3.5 py-3">
                  <div className={invertedTip.wrap}>
                    <WellTooltipSection kicker="Plate position">
                      <p className={invertedTip.wellTitle}>{wellId}</p>
                      {isBest ? (
                        <p className={cn(invertedTip.note, 'mt-1.5')}>
                          Best well for this metric on this plate.
                        </p>
                      ) : null}
                    </WellTooltipSection>
                    <div className={invertedTip.divider} aria-hidden />
                    <WellTooltipSection kicker={METRIC_LABELS[metric]}>
                      <p className={invertedTip.metricValue}>
                        {well
                          ? value !== null
                            ? value.toFixed(4)
                            : 'No value for this metric'
                          : 'No measurement data for this well'}
                      </p>
                    </WellTooltipSection>
                    {well ? (
                      <>
                        <div className={invertedTip.divider} aria-hidden />
                        <WellTooltipSection kicker="Experimental design">
                          <WellDesignParamList params={well.params} />
                        </WellTooltipSection>
                      </>
                    ) : null}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}

      {/* Color scale */}
      <div className={`mt-4 space-y-2 ${ml}`}>
        <div className="flex items-center gap-2">
          <span
            className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground shrink-0 w-16 text-right`}
          >
            {legendLowHigh.low}
          </span>
          <div
            className="h-3 flex-1 rounded-md border border-border/80 min-w-[120px]"
            style={{ background: gradientStops() }}
          />
          <span
            className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground shrink-0 w-16`}
          >
            {legendLowHigh.high}
          </span>
        </div>
        <div
          className={`flex justify-between ${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground pl-16 pr-16`}
        >
          <span>{min.toFixed(4)}</span>
          <span>{max.toFixed(4)}</span>
        </div>
        {bestOnPlate && !compact ? (
          <p className="text-sm text-foreground">
            <span className="font-medium text-amber-700 dark:text-amber-400">Best on plate:</span> well{' '}
            <WellIdWithDesign
              wellId={bestOnPlate.well}
              params={results.find((r) => r.well === bestOnPlate.well)?.params}
            />{' '}
            ({bestOnPlate.value.toFixed(4)})
          </p>
        ) : null}
        {bestOnPlate && compact ? (
          <p className="text-[10px] text-muted-foreground">
            Best:{' '}
            <WellIdWithDesign
              wellId={bestOnPlate.well}
              params={results.find((r) => r.well === bestOnPlate.well)?.params}
              showAffordance={false}
              className="text-foreground text-[10px]"
            />{' '}
            ({bestOnPlate.value.toFixed(4)})
          </p>
        ) : null}
      </div>
    </div>
  );
}
