import factoryModule from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist';

const createPlotlyComponent = typeof factoryModule === 'function'
  ? factoryModule
  : (factoryModule as { default: typeof factoryModule }).default;

const Plot = createPlotlyComponent(Plotly);
export default Plot;
