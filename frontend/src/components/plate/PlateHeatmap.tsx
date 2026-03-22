import { useMemo } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { WellResult, MetricKey } from '@/types';

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const COLS = Array.from({ length: 12 }, (_, i) => i + 1);

interface Props {
  results: WellResult[];
  metric: MetricKey;
  selectedWell: string | null;
  onSelectWell: (well: string) => void;
}

function getMetricValue(well: WellResult, metric: MetricKey): number | null {
  const v = well[metric];
  return typeof v === 'number' ? v : null;
}

function interpolateColor(t: number): string {
  // Blue (low) -> Green (mid) -> Yellow (high)
  const r = t < 0.5 ? Math.round(30 + t * 2 * 80) : Math.round(110 + (t - 0.5) * 2 * 145);
  const g = t < 0.5 ? Math.round(100 + t * 2 * 120) : Math.round(220 - (t - 0.5) * 2 * 30);
  const b = t < 0.5 ? Math.round(200 - t * 2 * 150) : Math.round(50 - (t - 0.5) * 2 * 40);
  return `rgb(${r}, ${g}, ${b})`;
}

export function PlateHeatmap({ results, metric, selectedWell, onSelectWell }: Props) {
  const wellMap = useMemo(() => {
    const map = new Map<string, WellResult>();
    for (const r of results) map.set(r.well, r);
    return map;
  }, [results]);

  const { min, max } = useMemo(() => {
    const values = results.map((r) => getMetricValue(r, metric)).filter((v): v is number => v !== null);
    if (values.length === 0) return { min: 0, max: 1 };
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [results, metric]);

  const normalize = (v: number | null): number => {
    if (v === null || max === min) return 0.5;
    return (v - min) / (max - min);
  };

  return (
    <div className="inline-block">
      {/* Column headers */}
      <div className="flex ml-8 mb-1">
        {COLS.map((col) => (
          <div key={col} className="w-10 text-center text-xs text-muted-foreground font-medium">
            {col}
          </div>
        ))}
      </div>

      {/* Plate grid */}
      {ROWS.map((row) => (
        <div key={row} className="flex items-center mb-1">
          <div className="w-8 text-xs text-muted-foreground font-medium text-right pr-2">{row}</div>
          {COLS.map((col) => {
            const wellId = `${row}${col}`;
            const well = wellMap.get(wellId);
            const value = well ? getMetricValue(well, metric) : null;
            const t = normalize(value);
            const color = value !== null ? interpolateColor(t) : '#e5e7eb';
            const isSelected = wellId === selectedWell;

            return (
              <Tooltip key={wellId}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectWell(wellId)}
                    className={`w-9 h-9 mx-0.5 rounded-full border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-foreground scale-110 shadow-md'
                        : 'border-transparent hover:border-muted-foreground/50 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-semibold">{wellId}</p>
                  {well ? (
                    <p>{value !== null ? value.toFixed(4) : 'N/A'}</p>
                  ) : (
                    <p className="text-muted-foreground">No data</p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}

      {/* Color scale legend */}
      <div className="flex items-center mt-3 ml-8 gap-2">
        <span className="text-xs text-muted-foreground">{min.toFixed(3)}</span>
        <div
          className="h-3 flex-1 rounded-full"
          style={{
            background: `linear-gradient(to right, ${interpolateColor(0)}, ${interpolateColor(0.5)}, ${interpolateColor(1)})`,
          }}
        />
        <span className="text-xs text-muted-foreground">{max.toFixed(3)}</span>
      </div>
    </div>
  );
}
