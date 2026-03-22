import Plot from './Plot';
import type { IterationSummary } from '@/types';

interface Props {
  iterations: IterationSummary[];
}

export function OptimizationProgress({ iterations }: Props) {
  if (iterations.length === 0) {
    return <p className="text-sm text-muted-foreground">No data to display.</p>;
  }

  const labels = iterations.map((it) => it.iteration_id);
  const bestRates = iterations.map((it) => it.best_growth_rate);
  const meanRates = iterations.map((it) => it.mean_growth_rate);

  return (
    <Plot
      data={[
        {
          x: labels,
          y: bestRates,
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Best growth rate',
          marker: { color: '#16a34a', size: 8 },
          line: { color: '#16a34a', width: 2 },
        },
        {
          x: labels,
          y: meanRates,
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Mean growth rate',
          marker: { color: '#94a3b8', size: 6 },
          line: { color: '#94a3b8', width: 1.5, dash: 'dot' },
        },
      ]}
      layout={{
        xaxis: { title: { text: 'Iteration' }, gridcolor: '#e5e7eb' },
        yaxis: { title: { text: 'Growth Rate (1/h)' }, gridcolor: '#e5e7eb' },
        margin: { l: 50, r: 20, t: 10, b: 50 },
        height: 300,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { size: 11 },
        legend: { orientation: 'h', y: -0.25 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      useResizeHandler
      style={{ width: '100%' }}
    />
  );
}
