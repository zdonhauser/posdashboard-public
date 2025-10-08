import React from 'react';
import moment from 'moment-timezone';

interface DateSelectorProps {
  selectedDate: string;
  tempDate: string;
  isEditingDate: boolean;
  isHistoricalDate: boolean;
  onDateChange: (newDate: string, immediate?: boolean) => void;
  onStartEditing: () => void;
  onCancelEdit: () => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  tempDate,
  isEditingDate,
  isHistoricalDate,
  onDateChange,
  onStartEditing,
  onCancelEdit,
}) => {
  return (
    <div className="dashboard-date">
      {isEditingDate ? (
        <div className="date-editor">
          <input
            type="date"
            value={tempDate}
            onChange={(e) => onDateChange(e.target.value)}
            onBlur={(e) => {
              // Only cancel if not clicking on a button
              if (!e.relatedTarget?.classList.contains('date-action-button')) {
                onCancelEdit();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onDateChange(tempDate, true);
              } else if (e.key === 'Escape') {
                onCancelEdit();
              }
            }}
            max={moment.tz('America/Chicago').format('YYYY-MM-DD')}
            autoFocus
          />
          <div className="date-editor-actions">
            <button
              className="date-action-button save"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onDateChange(tempDate, true)}
              title="Apply date immediately"
            >
              ✓
            </button>
            <button
              className="date-action-button cancel"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onCancelEdit}
              title="Cancel date change"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div className="date-display">
          <h2>
            {moment.tz(selectedDate, 'America/Chicago').format('dddd, MMMM DD, YYYY')}
            <span
              className="edit-date-icon"
              onClick={onStartEditing}
              title="Change date"
            >
              &nbsp;📅
            </span>
          </h2>
        </div>
      )}
      {isHistoricalDate && (
        <span className="historical-note">(Historical Data)</span>
      )}
    </div>
  );
};