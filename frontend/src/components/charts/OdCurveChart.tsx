import { useMemo } from 'react';
import Plot from './Plot';
import type { OdReading } from '@/types';

interface Props {
  data: OdReading[];
  well: string;
}

export function OdCurveChart({ data, well }: Props) {
  const figure = useMemo(() => {
    const plotData = [
      {
        x: data.map((d) => d.elapsed_hours),
        y: data.map((d) => d.od600),
        type: 'scatter' as const,
        mode: 'lines+markers' as const,
        marker: { color: '#2563eb', size: 4 },
        line: { color: '#2563eb', width: 2 },
        name: `Well ${well}`,
      },
    ];
    const layout = {
      uirevision: `od-${well}`,
      title: { text: `OD600 vs Time - Well ${well}`, font: { size: 14 } },
      xaxis: { title: { text: 'Elapsed Time (hours)' }, gridcolor: '#e5e7eb' },
      yaxis: { title: { text: 'OD600' }, gridcolor: '#e5e7eb' },
      margin: { l: 50, r: 20, t: 40, b: 50 },
      height: 280,
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { size: 11 },
    };
    const config = { displayModeBar: false, responsive: true };
    return { data: plotData, layout, config };
  }, [data, well]);

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No time-series data available.</p>;
  }

  return (
    <Plot
      data={figure.data}
      layout={figure.layout}
      config={figure.config}
      useResizeHandler
      style={{ width: '100%' }}
    />
  );
}
