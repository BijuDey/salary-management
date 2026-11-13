/**
 * Recharts writes colours into SVG presentation attributes, where CSS custom properties do not
 * resolve reliably, so chart colours are concrete values kept in step with globals.css.
 * Single-series marks use one validated teal; text stays in ink colours, never the mark colour.
 */
export const chartTheme = {
  mark: '#1f7a72', // --chart-1
  grid: '#dde1dc', // --border
  hover: '#eceeea', // --muted
  axisText: '#5e6b6a', // --muted-foreground
  labelText: '#1d2626', // --foreground
} as const;

export const axisTick = { fill: chartTheme.axisText, fontSize: 12 };
