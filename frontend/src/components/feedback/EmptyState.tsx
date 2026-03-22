import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function EmptyState({ title, description, children }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-prose">{description}</p>
      {children}
    </div>
  );
}
