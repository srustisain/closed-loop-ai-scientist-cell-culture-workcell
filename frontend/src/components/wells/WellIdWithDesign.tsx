import { useMemo, useState } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { WellDesignParamList, WellTooltipSection } from '@/components/wells/wellTooltipContent';
import { invertedTip } from '@/components/wells/wellTooltipTokens';
import { formatDesignParamsInline } from '@/lib/wellDesign';
import { useIteration } from '@/api/client';

type Props = {
  wellId: string;
  /** Design parameters when already available (e.g. from iteration results). */
  params?: Record<string, number> | null;
  /**
   * When `params` is not passed, fetch iteration on first hover and read design from results.
   */
  lazyLoadIterationId?: string;
  className?: string;
  /** Visually indicate extra info on hover (dotted underline). */
  showAffordance?: boolean;
};

/**
 * Well ID with a tooltip describing the experimental design (so plate positions are interpretable).
 */
export function WellIdWithDesign({
  wellId,
  params: paramsProp,
  lazyLoadIterationId,
  className,
  showAffordance = true,
}: Props) {
  const [activated, setActivated] = useState(false);
  const needsLazyFetch = Boolean(lazyLoadIterationId) && paramsProp == null && activated;

  const { data, isFetching } = useIteration(lazyLoadIterationId ?? '', {
    enabled: needsLazyFetch,
  });

  const params = useMemo(() => {
    if (paramsProp != null) return paramsProp;
    if (!data || !lazyLoadIterationId) return null;
    return data.results.find((r) => r.well === wellId)?.params ?? null;
  }, [paramsProp, data, lazyLoadIterationId, wellId]);

  const hasParamsObject = paramsProp !== undefined || lazyLoadIterationId != null;
  const showTooltip = hasParamsObject;

  if (!showTooltip) {
    return (
      <span className={cn('font-mono tabular-nums', className)} title={wellId}>
        {wellId}
      </span>
    );
  }

  const tooltipBody = (
    <div className={invertedTip.wrap}>
      <WellTooltipSection kicker="Plate position">
        <p className={invertedTip.wellTitle}>{wellId}</p>
      </WellTooltipSection>
      <div className={invertedTip.divider} aria-hidden />
      <WellTooltipSection kicker="Experimental design">
        {isFetching ? (
          <p className="text-xs leading-relaxed text-background/75">Loading design…</p>
        ) : (
          <WellDesignParamList params={params ?? {}} />
        )}
      </WellTooltipSection>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <span
            {...props}
            className={cn(
              'font-mono tabular-nums cursor-default',
              showAffordance && 'border-b border-dotted border-muted-foreground/50',
              className,
              props.className,
            )}
            onMouseEnter={(e) => {
              setActivated(true);
              props.onMouseEnter?.(e);
            }}
          >
            {wellId}
          </span>
        )}
      />
      <TooltipContent side="top" className="px-3.5 py-3">
        {tooltipBody}
      </TooltipContent>
    </Tooltip>
  );
}

/** Inline design summary next to a well label (no tooltip). */
export function WellDesignInline({
  params,
  className,
}: {
  params: Record<string, number> | null | undefined;
  className?: string;
}) {
  const s = formatDesignParamsInline(params ?? undefined);
  if (!s) return null;
  return <span className={cn('text-muted-foreground font-normal', className)}>{s}</span>;
}
