import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useIterations } from '@/api/client';
import { OptimizationProgress } from '@/components/charts/OptimizationProgress';
import { ApiErrorState } from '@/components/feedback/ApiErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';

export function Dashboard() {
  const { data: iterations, isLoading, error, refetch } = useIterations();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[320px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ApiErrorState
        message={(error as Error).message}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!iterations || iterations.length === 0) {
    return (
      <EmptyState
        title="Dashboard"
        description="No iterations found. Run an experiment or generate mock data to get started."
      />
    );
  }

  const totalIterations = iterations.length;
  const globalBest = iterations.reduce((best, it) =>
    it.best_growth_rate > best.best_growth_rate ? it : best
  );
  const latest = iterations[iterations.length - 1];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Total Iterations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalIterations}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Best Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{globalBest.best_growth_rate.toFixed(4)} <span className="text-base font-normal text-muted-foreground">/h</span></p>
            <p className="text-sm text-muted-foreground mt-1">
              Well {globalBest.best_well} in {globalBest.iteration_id}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Latest Iteration</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to={`/iterations/${latest.iteration_id}`}
              className="text-3xl font-bold text-primary hover:underline"
            >
              {latest.iteration_id}
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {latest.well_count} wells, best: {latest.best_growth_rate.toFixed(4)} /h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Optimization progress chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Optimization Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizationProgress iterations={iterations} />
        </CardContent>
      </Card>
    </div>
  );
}
