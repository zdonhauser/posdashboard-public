// DateSelector.tsx
import React from 'react';

interface DateSelectorProps {
  waiting: boolean;
  todaysDateValue: string;
  setTodaysDateValue: (value: string) => void;
  setTodayDate: (value: string) => void;
  visitorCount: Record<string, number>;
  calendarCount: Record<string, number>;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  startDateRegister: string;
  setStartDateRegister: (value: string) => void;
  endDateRegister: string;
  setEndDateRegister: (value: string) => void;
  procTotals: any[];
  dateSearch: () => void;
}

const DateSelector: React.FC<DateSelectorProps> = (props) => {
  const {
    waiting,
    todaysDateValue,
    setTodaysDateValue,
    setTodayDate,
    visitorCount,
    calendarCount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startDateRegister,
    setStartDateRegister,
    endDateRegister,
    setEndDateRegister,
    procTotals,
    dateSearch,
  } = props;

  if (waiting) {
    return (
      <div>
        <h4>
          {startDate} to {endDate}{' '}
        </h4>
      </div>
    );
  } else {
    return (
      <div>
        <h3>Today's Date:</h3>
        <input
          type="date"
          id="todays"
          name=""
          value={todaysDateValue}
          onChange={(e) => {
            const parsedDate = new Date(e.target.value + 'T00:00:00');
            const timezoneOffset = parsedDate.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
            const localDate = new Date(parsedDate.getTime() + timezoneOffset);

            setTodayDate(
              new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Chicago',
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
              })
                .format(localDate)
                .split('/')
                .join('')
                .slice(0, 6)
            );
            setTodaysDateValue(e.target.value);
          }}
        />
        <br />
        <br />
        <h3>Visitor Count: </h3>
        {Object.keys(visitorCount).map((key) =>
          visitorCount[key] ? (
            <span key={key}>
              {key}: {visitorCount[key]}&emsp;
            </span>
          ) : null
        )}
        <h3>Calendar Count: </h3>
        {Object.keys(calendarCount).map((key) =>
          calendarCount[key] ? (
            <span key={key}>
              {key}: {calendarCount[key]}&emsp;
            </span>
          ) : null
        )}

        {startDate ? (
          <>
          <h3> Date range for Processor Reports: </h3>
          <input
          type="date"
          id="start"
          name="date-start"
          max={endDate}
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
          }}
        />
        &emsp; to &emsp;
        <input
          type="date"
          id="end"
          name="date-end"
          min={startDate}
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
          }}
        />
</>


        ) : null}
        
        <h3> Date range for Register Reports: </h3>
        <input
          type="date"
          id="start"
          name="date-start"
          max={endDateRegister}
          value={startDateRegister}
          onChange={(e) => {
            setStartDateRegister(e.target.value);
          }}
        />
        &emsp; to &emsp;
        <input
          type="date"
          id="end"
          name="date-end"
          min={startDateRegister}
          value={endDateRegister}
          onChange={(e) => {
            setEndDateRegister(e.target.value);
          }}
        />
        {procTotals[0][0]?.length > 0 ? (
          ''
        ) : (
          <button className="smallButton" onClick={dateSearch}>
            {' '}
            Go{' '}
          </button>
        )}
      </div>
    );
  }
};

export default DateSelector;
