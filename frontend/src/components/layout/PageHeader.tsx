import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  /** One or two short sentences: what this page is for and what to do here. */
  description: string;
  /** Optional controls on the same row as the title (e.g. iteration selector). */
  titleAddon?: ReactNode;
  className?: string;
};

/**
 * Page section title + lead text (below the site header in the main column).
 */
export function PageHeader({ title, description, titleAddon, className }: Props) {
  return (
    <header className={cn('space-y-2', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {titleAddon}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{description}</p>
    </header>
  );
}
