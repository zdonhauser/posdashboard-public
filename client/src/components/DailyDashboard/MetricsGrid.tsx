import React from 'react';

interface MetricsData {
  transactionCount: number;
  averageTransaction: number;
  onlineTotal: number;
  posTotal: number;
  onlineCount: number;
  posCount: number;
  totalFees: number;
  totalTax: number;
}

interface MetricsGridProps {
  totalSales: number;
  metrics: MetricsData;
  formatCurrency: (amount: number) => string;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  totalSales,
  metrics,
  formatCurrency
}) => {
  return (
    <div className="metrics-grid">
      <div className="metric-card primary">
        <div className="metric-label">Total Sales</div>
        <div className="metric-value">{formatCurrency(totalSales)}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Transactions</div>
        <div className="metric-value">{metrics.transactionCount}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Average Sale</div>
        <div className="metric-value">{formatCurrency(metrics.averageTransaction)}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Online Sales</div>
        <div className="metric-value">
          {formatCurrency(metrics.onlineTotal)}
          <span className="metric-count">({metrics.onlineCount} transactions)</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label">POS Sales</div>
        <div className="metric-value">
          {formatCurrency(metrics.posTotal)}
          <span className="metric-count">({metrics.posCount} transactions)</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Total Fees</div>
        <div className="metric-value">{formatCurrency(metrics.totalFees)}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Total Tax</div>
        <div className="metric-value">{formatCurrency(metrics.totalTax)}</div>
      </div>

      <div className="metric-card">
        <div className="metric-label">Net Amount</div>
        <div className="metric-value">
          {formatCurrency(totalSales - metrics.totalFees)}
        </div>
      </div>
    </div>
  );
};