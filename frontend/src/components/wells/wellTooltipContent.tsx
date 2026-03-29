import type { ReactNode } from 'react';
import { invertedTip } from '@/components/wells/wellTooltipTokens';
import { designParamEntries, type DesignParamEntry } from '@/lib/wellDesign';
import { cn } from '@/lib/utils';

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
      {entries.map((e: DesignParamEntry) => (
        <li key={e.key} className="flex flex-col gap-0.5">
          <span className="text-[11px] font-medium leading-tight text-background">{e.label}</span>
          <span className="font-mono text-sm font-semibold tabular-nums text-background/95">{e.display}</span>
        </li>
      ))}
    </ul>
  );
}
