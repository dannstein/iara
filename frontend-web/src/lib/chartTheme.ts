import type { CSSProperties } from 'react';

export const tooltipStyle: CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--text-primary)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  padding: '8px 12px',
};

export const tooltipItemStyle: CSSProperties = { color: 'var(--text-primary)' };
export const tooltipLabelStyle: CSSProperties = { color: 'var(--text-secondary)' };

export const gridStyle = { stroke: 'var(--border-subtle)', strokeDasharray: '3 3' };
export const axisStyle = { fill: 'var(--text-muted)', fontSize: 11 };
