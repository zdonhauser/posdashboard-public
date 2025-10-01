import { useEffect, useRef, useMemo, useState } from 'react';
import moment from 'moment-timezone';
import * as Plotly from 'plotly.js-dist';
import { Transaction } from './useFetchDailyTransactions';

interface UseRevenueChartProps {
  transactions: Transaction[];
  selectedDate: string;
}

interface UseRevenueChartReturn {
  plotRef: React.RefObject<HTMLDivElement>;
  chartError: string | null;
}

export function useRevenueChart({ transactions, selectedDate }: UseRevenueChartProps): UseRevenueChartReturn {
  const plotRef = useRef<HTMLDivElement>(null);
  const chartInitialized = useRef<boolean>(false);
  const [chartError, setChartError] = useState<string | null>(null);

  // Calculate accumulated transaction amounts
  const accumulatedTransactionAmounts = useMemo(() => {
    const amounts = transactions.map(t => Number(t.amount));
    const accumulatedTotals = amounts.map((_, index) => {
      return amounts.slice(0, index + 1).reduce((a, b) => a + b, 0);
    });
    return accumulatedTotals;
  }, [transactions]);

  // Format transaction timestamps
  const transactionTimestamps = useMemo(() => {
    const timestamps = transactions.map(t => {
      return moment.tz(t.processedAt, 'America/Chicago').format('YYYY-MM-DDTHH:mm:ss')
    });
    return timestamps;
  }, [transactions]);

  // Memoized chart configuration
  const chartLayout = useMemo(() => ({
    title: {
      text: 'Cumulative Revenue Throughout the Day',
      font: {
        color: '#fff',
        size: 18,
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }
    },
    xaxis: {
      title: {
        text: 'Time',
        font: {
          color: '#bbb',
          size: 14
        }
      },
      gridcolor: '#444',
      zerolinecolor: '#555',
      tickfont: {
        color: '#999'
      },
      showgrid: true,
      type: 'date',
      range: accumulatedTransactionAmounts.length === 0
        ? [
            moment.tz(selectedDate, 'America/Chicago').startOf('day').format('YYYY-MM-DDTHH:mm:ss'),
            moment.tz(selectedDate, 'America/Chicago').endOf('day').format('YYYY-MM-DDTHH:mm:ss')
          ]
        : null,
    },
    yaxis: {
      title: {
        text: 'Revenue ($)',
        font: {
          color: '#bbb',
          size: 14
        }
      },
      gridcolor: '#444',
      zerolinecolor: '#555',
      tickfont: {
        color: '#999'
      },
      tickformat: '$,.0f',
      showgrid: true,
    },
    plot_bgcolor: '#2a2a2a',
    paper_bgcolor: '#1a1a1a',
    margin: {
      l: 80,
      r: 40,
      t: 80,
      b: 60
    },
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#333',
      font: {
        color: '#fff',
        size: 12
      },
      bordercolor: '#667eea'
    },
    showlegend: true,
    legend: {
      font: {
        color: '#bbb',
        size: 12
      },
      orientation: 'h',
      xanchor: 'center',
      yanchor: 'bottom',
      y: 1.02,
      x: 0.5
    }
  }), [selectedDate, accumulatedTransactionAmounts.length]);

  // Memoized chart data
  const chartData = useMemo(() => ([
    {
      x: transactionTimestamps,
      y: accumulatedTransactionAmounts,
      type: 'scatter' as const,
      mode: 'lines+markers' as const,
      name: 'Cumulative Revenue',
      line: {
        color: '#667eea',
        width: 3,
        shape: 'hv' as const
      },
      marker: {
        color: '#764ba2',
        size: 6,
        line: {
          color: '#667eea',
          width: 1
        }
      },
      fill: 'tozeroy' as const,
      fillcolor: 'rgba(102, 126, 234, 0.1)',
      hovertemplate: '<b>Time:</b> %{x}<br><b>Revenue:</b> $%{y:,.2f}<extra></extra>',
    },
  ]), [transactionTimestamps, accumulatedTransactionAmounts]);

  // Optimized chart rendering with error handling
  useEffect(() => {
    if (plotRef.current) {
      const plotElement = plotRef.current;
      setChartError(null);

      try {
        if (!chartInitialized.current) {
          // Initial plot creation
          Plotly.newPlot(plotElement, chartData, chartLayout, { responsive: true });
          chartInitialized.current = true;
        } else {
          // Efficient update using Plotly.react()
          Plotly.react(plotElement, chartData, chartLayout, { responsive: true });
        }
      } catch (error) {
        console.error('Chart rendering error:', error);
        setChartError(error instanceof Error ? error.message : 'Chart rendering failed');

        // Fallback to recreation if update fails
        try {
          chartInitialized.current = false;
          Plotly.purge(plotElement);
          Plotly.newPlot(plotElement, chartData, chartLayout, { responsive: true });
          chartInitialized.current = true;
          setChartError(null);
        } catch (fallbackError) {
          console.error('Chart fallback recreation failed:', fallbackError);
          setChartError('Chart rendering completely failed');
        }
      }
    }
  }, [chartData, chartLayout]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (plotRef.current && chartInitialized.current) {
        try {
          Plotly.purge(plotRef.current);
        } catch (error) {
          console.warn('Chart cleanup error:', error);
        } finally {
          chartInitialized.current = false;
        }
      }
    };
  }, []);

  // Reset chart when date changes significantly
  useEffect(() => {
    if (chartInitialized.current) {
      chartInitialized.current = false;
    }
  }, [selectedDate]);

  return {
    plotRef,
    chartError
  };
}