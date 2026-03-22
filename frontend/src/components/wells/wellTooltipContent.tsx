import type { ReactNode } from 'react';
import { designParamEntries } from '@/lib/wellDesign';
import { cn } from '@/lib/utils';

/**
 * Typography for content inside TooltipContent (bg-foreground / inverted surface).
 * Avoids theme "muted-foreground" which is tuned for the main page and reads poorly here.
 */
export const invertedTip = {
  wrap: 'flex w-full min-w-[11rem] max-w-[20rem] flex-col gap-3 text-left',
  kicker:
    'mb-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-background/65',
  wellTitle: 'font-mono text-base font-semibold leading-tight tracking-tight text-background',
  metricValue: 'font-mono text-sm tabular-nums text-background',
  note: 'text-[11px] leading-snug text-amber-300 dark:text-amber-900',
  divider: 'w-full shrink-0 border-t border-background/20',
} as const;

export function WellTooltipSection({
  kicker,
  children,
  className,
}: {
  kicker: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(className)}>
      <h3 className={invertedTip.kicker}>{kicker}</h3>
      {children}
    </section>
  );
}

/** Label + value rows for experimental design (inverted tooltip). */
export function WellDesignParamList({ params }: { params: Record<string, number> }) {
  const entries = designParamEntries(params);
  if (entries.length === 0) {
    return (
      <p className="text-xs leading-relaxed text-background/70">
        No design parameters linked to this well.
      </p>
    );
  }
  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {entries.map((e) => (
        <li key={e.key} className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium leading-tight text-background">{e.label}</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-background/95">{e.display}</span>
        </li>
      ))}
    </ul>
  );
}
