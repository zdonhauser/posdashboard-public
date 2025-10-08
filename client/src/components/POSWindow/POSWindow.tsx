import "./POSWindow.scss";
import ButtonGrid from "../ButtonGrid/ButtonGrid";
import OrderPanel from "../OrderPanel/OrderPanel";
import CustomerPanel from "../CustomerPanel/CustomerPanel";
import PaymentButtons from "../PaymentButtons/PaymentButtons";
import { POSProvider, usePOS } from "../../contexts/POSContext";
import React from "react";
import { useUser } from "../../App";

interface POSProps {
  directoryHandle: FileSystemDirectoryHandle;
  isBFF: boolean;
  mode: "front" | "kitchen";
}

export default function POSWindow({
  directoryHandle,
  isBFF,
  mode,
}: POSProps): JSX.Element {
  return (
    <POSProvider directoryHandle={directoryHandle} isBFF={isBFF} mode={mode}>
      <POSWindowContent />
    </POSProvider>
  );
}

function POSWindowContent(): JSX.Element {

  const {
    typedValue,
    setTypedValue,
    orderId,
    fulfilled,
    setCurrentTab,
    searchMembers,
    searchOrders,
    handleKeyDown,
    attendanceCount,
    calendarAttendance,
    setRefreshAttendance,
    loadingMessages,
    inputRef,
    isSubmitting,
    setIsSubmitting,
    submissionMessage,
    mode,
  } = usePOS();

  const { user } = useUser();

  //AttendanceCount type
  interface AttendanceCount {
    [key: string]: number;
  }

  return (
    <div key="window" className="poswindow">
      {isSubmitting && (
        <div className="overlay">
          <div className="submission-message">
            {submissionMessage}
            <br/><br/>
            <button
              className="cancel-button"
              onClick={() => setIsSubmitting(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="buttonheader">
        <h3>ZDT's Point of Sale</h3>
        {loadingMessages.length > 0 || mode !== "front" ? (
          <span className="loadingmsgs">{loadingMessages[0]}</span>
        ) : (
          <>
            <div className="attendance-row">
              {Object.entries(attendanceCount as AttendanceCount)
                .sort(([, a], [, b]) => (b) - (a))
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="cashiername"
                    onClick={() => setRefreshAttendance(Math.random())}
                  >
                    {key}: {value}
                  </span>
                ))}
              <span className="cashiername">
                Total: {Object.values(attendanceCount as AttendanceCount).reduce(
                  (a, b) => a + b,
                  0
                )}
              </span>
            </div>
            <div className="calendar-row">
              {Object.entries(calendarAttendance as AttendanceCount)
                .sort(([, a], [, b]) => (b) - (a))
                .map(([key, value]) => (
                  <span
                    key={key}
                    className="cashiername"
                    onClick={() => setRefreshAttendance(Math.random())}
                  >
                    {key}: {value}
                  </span>
                ))}
              <span className="cashiername">
                Total: {Object.values(calendarAttendance as AttendanceCount).reduce(
                  (a, b) => a + b,
                  0
                )}
              </span>
            </div>
          </>
        )}
        <div className="search-row">
          <input
            ref={inputRef}
            className="posInput"
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            onKeyDown={(event) =>
              handleKeyDown(event as React.KeyboardEvent<HTMLInputElement>)
            }
          />
          {mode === 'front' && (
            <>
              <button
                className="searchbutton"
                onClick={(_e) => {
                  searchOrders(typedValue);
                  setCurrentTab(6);
                }}
              >
                Orders
              </button>
              <button
                className="searchbutton"
                onClick={(_e) => searchMembers(typedValue)}
              >
                Members
              </button>
            </>
          )}
        </div>
      </div>
      <div className={"buttonpanel " + (orderId && "hidebuttonpanel")}>
        <ButtonGrid />
      </div>
      <div className="orderheader">
        <CustomerPanel />
      </div>
      <div
        className={
          "receipt " +
          (orderId && "bigreceipt") +
          (fulfilled == "fulfilled" && "fulfilled")
        }
      >
        <OrderPanel />
      </div>
      <PaymentButtons />
    </div>
  );
}
