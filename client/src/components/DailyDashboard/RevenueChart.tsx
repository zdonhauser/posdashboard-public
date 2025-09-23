import React from 'react';
import { useRevenueChart } from './useRevenueChart';
import { Transaction } from './useFetchDailyTransactions';

interface RevenueChartProps {
  transactions: Transaction[];
  selectedDate: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  transactions,
  selectedDate
}) => {
  const { plotRef, chartError } = useRevenueChart({ transactions, selectedDate });

  return (
    <div className="revenue-plot-container">
      {chartError ? (
        <div className="chart-error">
          <h4>Chart Error</h4>
          <p>{chartError}</p>
          <p>The chart data is still being processed. Please try refreshing.</p>
        </div>
      ) : (
        <div ref={plotRef} className="revenue-plot"></div>
      )}
    </div>
  );
};