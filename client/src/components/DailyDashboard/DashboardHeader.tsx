import React from 'react';
import moment from 'moment-timezone';

interface DashboardHeaderProps {
  lastRefresh: Date;
  loading: boolean;
  onRefresh: () => void;
  onUpdate: () => void;
  canUpdate: boolean;
  hasNewTransactions: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  lastRefresh,
  loading,
  onRefresh,
  onUpdate,
  canUpdate,
  hasNewTransactions
}) => {
  return (
    <div className="dashboard-header">
      <h1>Daily Sales Dashboard</h1>
      <div className="header-actions">
        <span className="last-refresh">
          Last updated: {moment(lastRefresh).format('h:mm:ss A')}
          {hasNewTransactions && <span className="new-indicator"> • New data loaded</span>}
        </span>
        <div className="action-buttons">
          <button
            onClick={onUpdate}
            className="update-button"
            disabled={loading || !canUpdate}
            title={canUpdate ? "Check for new transactions since last update" : "Update only available for today's date"}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
          <button
            onClick={onRefresh}
            className="refresh-button"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};