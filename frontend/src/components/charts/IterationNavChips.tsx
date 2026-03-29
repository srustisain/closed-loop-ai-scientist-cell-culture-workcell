import { Link } from 'react-router-dom';
import { colorForIterationId } from '@/lib/iterationColors';

type Props = {
  /** Same iteration order as the chart palette (e.g. sorted by id). */
  iterationIds: string[];
};

/** Links to iteration detail pages (same palette as the charts). Complements legend toggles. */
export function IterationNavChips({ iterationIds }: Props) {
  if (iterationIds.length === 0) return null;

  return (
    <div className="relative z-10 mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-border/60 pt-4 pointer-events-auto">
      <span className="text-xs text-muted-foreground">Open iteration:</span>
      {iterationIds.map((id) => {
        const color = colorForIterationId(id, iterationIds);
        return (
          <Link
            key={id}
            to={`/iterations/${encodeURIComponent(id)}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground underline-offset-2 transition-colors hover:bg-muted hover:underline"
          >
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {id}
          </Link>
        );
      })}
    </div>
  );
}
