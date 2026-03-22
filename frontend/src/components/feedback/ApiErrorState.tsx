import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

/** Consistent card for TanStack Query / fetch failures. */
export function ApiErrorState({ title = 'Could not load data', message, onRetry }: Props) {
  return (
    <Card className="border-destructive/50 max-w-lg">
      <CardHeader>
        <CardTitle className="text-destructive text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground break-words">{message}</p>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
