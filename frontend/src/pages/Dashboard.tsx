import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIterations } from '@/api/client';
import { OptimizationProgress } from '@/components/charts/OptimizationProgress';

export function Dashboard() {
  const { data: iterations, isLoading, error } = useIterations();

  if (isLoading) {
    return <p className="text-muted-foreground">Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {(error as Error).message}</p>;
  }

  if (!iterations || iterations.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          No iterations found. Run an experiment or generate mock data to get started.
        </p>
      </div>
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
