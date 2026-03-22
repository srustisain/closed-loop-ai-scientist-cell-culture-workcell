import Plot from 'react-plotly.js';
import type { OdReading } from '@/types';

interface Props {
  data: OdReading[];
  well: string;
}

export function OdCurveChart({ data, well }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No time-series data available.</p>;
  }

  return (
    <Plot
      data={[
        {
          x: data.map((d) => d.elapsed_hours),
          y: data.map((d) => d.od600),
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: '#2563eb', size: 4 },
          line: { color: '#2563eb', width: 2 },
          name: `Well ${well}`,
        },
      ]}
      layout={{
        title: { text: `OD600 vs Time - Well ${well}`, font: { size: 14 } },
        xaxis: { title: { text: 'Elapsed Time (hours)' }, gridcolor: '#e5e7eb' },
        yaxis: { title: { text: 'OD600' }, gridcolor: '#e5e7eb' },
        margin: { l: 50, r: 20, t: 40, b: 50 },
        height: 280,
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { size: 11 },
      }}
      config={{ displayModeBar: false, responsive: true }}
      useResizeHandler
      style={{ width: '100%' }}
    />
  );
}
