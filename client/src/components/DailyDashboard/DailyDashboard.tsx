import React, { useState, useMemo } from 'react';
import './DailyDashboard.scss';
import { useFetchDailyTransactions } from './useFetchDailyTransactions';
import { useDateSelection } from './useDateSelection';
import { DashboardHeader } from './DashboardHeader';
import { DateSelector } from './DateSelector';
import { RevenueChart } from './RevenueChart';
import { MetricsGrid } from './MetricsGrid';
import { TransactionsTable } from './TransactionsTable';
import { ErrorBoundary } from './ErrorBoundary';

const DailyDashboard: React.FC = () => {
  const {
    selectedDate,
    tempDate,
    isEditingDate,
    handleDateChange,
    handleDateEditCancel,
    handleStartEditingDate,
    isHistoricalDate,
  } = useDateSelection();

  const { transactions, loading, error, totalSales, refetch, update, pagesFetched, hasNewTransactions, canUpdate } = useFetchDailyTransactions(selectedDate);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const handleRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  const handleUpdate = () => {
    update();
    setLastRefresh(new Date());
  };


  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };



  // Calculate additional metrics
  const metrics = useMemo(() => {
    const transactionCount = transactions.length;
    const averageTransaction = transactionCount > 0 ? totalSales / transactionCount : 0;
    
    const onlineTransactions = transactions.filter(t => t.source === 'online');
    const posTransactions = transactions.filter(t => t.source === 'POS');
    
    const onlineTotal = onlineTransactions.reduce((sum, t) => sum + t.amount, 0);
    const posTotal = posTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const totalFees = transactions.reduce((sum, t) => sum + t.fees, 0);
    const totalTax = transactions.reduce((sum, t) => sum + t.taxTotal, 0);
    
    return {
      transactionCount,
      averageTransaction,
      onlineTotal,
      posTotal,
      onlineCount: onlineTransactions.length,
      posCount: posTransactions.length,
      totalFees,
      totalTax
    };
  }, [transactions]);

  if (error) {
    return (
      <div className="daily-dashboard">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="refresh-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-dashboard">
      <DashboardHeader
        lastRefresh={lastRefresh}
        loading={loading}
        onRefresh={handleRefresh}
        onUpdate={handleUpdate}
        canUpdate={canUpdate}
        hasNewTransactions={hasNewTransactions}
      />

      <div className="dashboard-content">
        <ErrorBoundary>
          <DateSelector
            selectedDate={selectedDate}
            tempDate={tempDate}
            isEditingDate={isEditingDate}
            isHistoricalDate={isHistoricalDate}
            onDateChange={handleDateChange}
            onStartEditing={handleStartEditingDate}
            onCancelEdit={handleDateEditCancel}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <RevenueChart
            transactions={transactions}
            selectedDate={selectedDate}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <MetricsGrid
            totalSales={totalSales}
            metrics={metrics}
            formatCurrency={formatCurrency}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <TransactionsTable
            transactions={transactions}
            loading={loading}
            pagesFetched={pagesFetched}
            totalSales={totalSales}
            metrics={metrics}
            formatCurrency={formatCurrency}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default DailyDashboard;