import React from 'react';
import moment from 'moment-timezone';
import { Transaction } from './useFetchDailyTransactions';

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

interface TransactionsTableProps {
  transactions: Transaction[];
  loading: boolean;
  pagesFetched: number;
  totalSales: number;
  metrics: MetricsData;
  formatCurrency: (amount: number) => string;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
  pagesFetched,
  totalSales,
  metrics,
  formatCurrency
}) => {
  const formatTime = (dateString: string): string => {
    return moment(dateString).tz('America/Chicago').format('h:mm:ss A');
  };

  return (
    <div className="transactions-section">
      <div className="section-header">
        <h3>Transactions</h3>
        {loading && pagesFetched > 0 && (
          <span className="loading-indicator">Loading page {pagesFetched + 1}...</span>
        )}
      </div>
      {loading && transactions.length === 0 ? (
        <div className="loading-state">Loading transactions...</div>
      ) : (
        <div className="transactions-table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Order #</th>
                <th>Amount</th>
                <th>Tax</th>
                <th>Fees</th>
                <th>Net</th>
                <th>Payment</th>
                <th>Source</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">
                    No transactions yet today
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className={transaction.amount < 0 ? 'refund-row' : ''}>
                    <td>{formatTime(transaction.processedAt)}</td>
                    <td>{transaction.orderName || '-'}</td>
                    <td className={transaction.amount < 0 ? 'negative' : 'positive'}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>{formatCurrency(transaction.taxTotal)}</td>
                    <td>{formatCurrency(transaction.fees)}</td>
                    <td>{formatCurrency(transaction.amount - transaction.fees)}</td>
                    <td>{transaction.gateway}</td>
                    <td>
                      <span className={`source-badge ${transaction.source.toLowerCase()}`}>
                        {transaction.source}
                      </span>
                    </td>
                    <td>{transaction.customer?.displayName || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={2}><strong>Totals</strong></td>
                  <td><strong>{formatCurrency(totalSales)}</strong></td>
                  <td><strong>{formatCurrency(metrics.totalTax)}</strong></td>
                  <td><strong>{formatCurrency(metrics.totalFees)}</strong></td>
                  <td><strong>{formatCurrency(totalSales - metrics.totalFees)}</strong></td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
};