/**
 * Typography tokens for content inside TooltipContent (bg-foreground / inverted surface).
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
