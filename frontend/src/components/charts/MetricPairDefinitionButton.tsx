import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { METRIC_HELP } from '@/lib/metricDefinitions';
import { METRIC_LABELS } from '@/types';
import type { MetricKey } from '@/types';

type Props = {
  xMetric: MetricKey;
  yMetric: MetricKey;
};

/** Single control with both axis definitions (avoids duplicate info icons). */
export function MetricPairDefinitionButton({ xMetric, yMetric }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/80 bg-background text-muted-foreground shadow-sm outline-none ring-offset-background transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="About the horizontal and vertical metrics"
      >
        <Info className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(24rem,calc(100vw-2rem))] max-h-[min(70vh,28rem)] overflow-y-auto p-0"
        side="bottom"
        align="end"
      >
        <div className="border-b px-3 py-2">
          <p className="text-xs font-medium text-muted-foreground">Metric definitions</p>
        </div>
        <div className="divide-y">
          <section className="px-3 py-3">
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Horizontal (X)
            </p>
            <h4 className="text-sm font-medium leading-snug text-foreground">{METRIC_LABELS[xMetric]}</h4>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{METRIC_HELP[xMetric]}</p>
          </section>
          <section className="px-3 py-3">
            <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Vertical (Y)
            </p>
            <h4 className="text-sm font-medium leading-snug text-foreground">{METRIC_LABELS[yMetric]}</h4>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{METRIC_HELP[yMetric]}</p>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}
