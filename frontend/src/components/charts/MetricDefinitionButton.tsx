import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { METRIC_HELP } from '@/lib/metricDefinitions';
import { METRIC_LABELS } from '@/types';
import type { MetricKey } from '@/types';

type Props = {
  metric: MetricKey;
};

export function MetricDefinitionButton({ metric }: Props) {
  const title = METRIC_LABELS[metric];
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none ring-offset-background hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Definition: ${title}`}
      >
        <Info className="h-4 w-4" aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem)))]" side="right" align="start">
        <PopoverHeader>
          <PopoverTitle>{title}</PopoverTitle>
          <PopoverDescription className="text-xs leading-relaxed">
            {METRIC_HELP[metric]}
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}
