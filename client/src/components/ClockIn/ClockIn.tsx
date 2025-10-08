import React, { useState, useCallback, useEffect } from "react";
import Numpad from "../Numpad/Numpad";
import "./ClockIn.scss";
import useEventListener from "../EventListener/EventListener";
import { toast } from "react-toastify";
import { User } from "../POSWindow/POSTypes";
import moment from "moment-timezone";

interface ClockInProps {
  setView: (view: "login" | "clockin") => void;
}
const ClockIn: React.FC<ClockInProps> = (props) => {
  const [typedValue, setTypedValue] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [employee, setEmployee] = useState<User | null>(null); // Employee data including clock-in info
  const [clockEntries, setClockEntries] = useState<any[]>([]); // Weekly clock entries
  const [currentDuration, setCurrentDuration] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update current duration for "currently clocked in" entry
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (employee?.open_clock_entry_id) {
      interval = setInterval(() => {
        const openEntry = clockEntries.find(
          (entry) => entry.clock_out === null
        );
        if (openEntry) {
          setCurrentDuration(
            calculateDuration(openEntry.clock_in, new Date().toISOString())
          );
        }
      }, 1000); // Update every minute
    }

    return () => {
      clearInterval(interval);
    };
  }, [employee, clockEntries]);

  // Calculate totals every time clockEntries changes or currentDuration changes
  useEffect(() => {
    const total = clockEntries.reduce((total, entry) => {
      if (entry.clock_in && entry.clock_out) {
        const diff =
          new Date(entry.clock_out).getTime() -
          new Date(entry.clock_in).getTime();
        total += diff;
      } else if (entry.clock_in && !entry.clock_out) {
        const diff = new Date().getTime() - new Date(entry.clock_in).getTime();
        if(diff > 12*60*60*1000){
          return total;
        }
        total += diff;
      }
      return total;
    }, 0);

    setTotalDuration(total);
  }, [clockEntries, currentDuration]);

  const clearEmployeeData = () => {
    setTypedValue("");
    setEmployee(null);
    setClockEntries([]);
    sessionStorage.removeItem("token");
  };

  const printReceipt = (name: string, entries: any[]) => {
    return; // Disable receipt printing for now
    if (window.electronAPI && entries.length > 0) {
      (window.electronAPI as any)
        .printTimeclockReceipt(name, entries)
        .then(() => {
          console.log("Timeclock receipt print command sent");
        })
        .catch((error) => {
          console.error("Error printing receipt:", error);
          toast.error("Failed to print receipt.");
        });
    }
  };

  // Updated calculateDuration: uses Math.round to round hours to 2 decimals
  const calculateDuration = (
    clockIn: string,
    clockOut: string | null
  ): string => {
    if (!clockIn) return "0.00";
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    // Round to 2 decimals using Math.round
    const rounded = Math.round(diffHours * 100) / 100;
    if(rounded > 16){
      return "0.00";
    }
    return rounded.toFixed(2);
  };

  const formatTotalTime = (totalMilliseconds: number) => {
    return (totalMilliseconds / (1000 * 60 * 60)).toFixed(2);
  };

  const checkPin = async () => {
    try {
      const response = await fetch(`/api/employee/${typedValue}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      sessionStorage.setItem("token", data.token);

      if (response.ok) {
        setTypedValue("");
        setErrorMessage("");
        // Identify any open entry (clock_out === null)
        const rawOpenEntry = data.clockEntries.slice().reverse().find(
          (entry: any) => entry.clock_out === null
        );

        // Validate that the open entry is not older than 24 hours
        let validOpenEntryId: number | null = null;
        if (rawOpenEntry) {
          // Compute hours since clock-in in local timezone
          const hoursSinceClockIn = moment()
            .tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
            .diff(moment(rawOpenEntry.clock_in), "hours", true);
            console.log('hoursSinceClockIn', hoursSinceClockIn)
          // Only accept if within 24h
          if (hoursSinceClockIn <= 24) {
            validOpenEntryId = rawOpenEntry.id;
          }
        }
        setEmployee({ ...data, open_clock_entry_id: validOpenEntryId }); // Set employee data on success
        setClockEntries(data.clockEntries || []); // Set weekly clock entries
      } else {
        setErrorMessage(data.error || "An error occurred.");
        clearEmployeeData();
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setErrorMessage("Failed to fetch employee data.");
      clearEmployeeData();
    }
  };

  const handleClockIn = async () => {
    if (!employee || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (employee.active === false) {
        //activate employee
        try {
          const response = await fetch(
            `/api/employee/${employee.id}/activate`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
            }
          );

          const data = await response.json();
          if (response.ok) {
            setErrorMessage("");
          } else {
            setErrorMessage(data.error || "An error occurred.");
          }
        } catch (error) {
          console.error("Error activating employee:", error);
          setErrorMessage("Failed to activate employee.");
        }
      }

      // Use the browser's local timezone
      const clock_in = moment()
        .tz(Intl.DateTimeFormat().resolvedOptions().timeZone)
        .toISOString();

      const response = await fetch(`/api/employee/${employee.id}/clock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        const newEntry = data.entry;

        // Display the clock-in success message
        toast.success("Clocked in successfully!");
        toast.success(
          `Clock in time: ${moment(newEntry.clock_in).format("h:mm A")}`
        );

        const updatedEntries = [...clockEntries, newEntry];
        setClockEntries(updatedEntries);

        // Trigger receipt printing
        printReceipt(
          `${employee.firstname} ${employee.lastname}`,
          updatedEntries
        );

        clearEmployeeData();
      } else {
        toast.error(data.error || "Clock-in failed.");
        clearEmployeeData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClockOut = async () => {
    if (!employee || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/employee/clock/${employee.open_clock_entry_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        const newEntry = data.entry;
        const updatedEntries = clockEntries.map((entry) =>
          entry.id === newEntry.id ? newEntry : entry
        );

        // Calculate the total clocked-in time
        const totalClockedInTime = calculateDuration(
          newEntry.clock_in,
          newEntry.clock_out
        );

        // Display the clock-out success message
        toast.success("Clocked out successfully!");
        toast.success(
          `Clock out time: ${moment(newEntry.clock_out).format("h:mm A")}`
        );
        toast.success(`Total time clocked in: ${totalClockedInTime}.`);

        // Update state and print the receipt
        setClockEntries(updatedEntries);
        printReceipt(
          `${employee.firstname} ${employee.lastname}`,
          updatedEntries
        );

        clearEmployeeData();
      } else {
        toast.error(data.error || "Clock-out failed.");
        clearEmployeeData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (typedValue == "....") {
      props.setView("login");
    } else if (typedValue.length >= 4) {
      checkPin();
    }
  }, [typedValue.length]);

  const handler = useCallback(
    (event: KeyboardEvent) => {
      const num = event.key;

      // Handle numeric input and actions
      if (num >= "0" && num <= "9") {
        setTypedValue((prevValue) => prevValue + num);
      } else if (num === "Backspace") {
        setTypedValue((prevValue) => prevValue.slice(0, -1));
        if (employee) clearEmployeeData();
      } else if (num === "Escape") {
        clearEmployeeData();
      } else if (num === "Enter") {
        // Trigger Clock In/Out
        if (employee?.open_clock_entry_id) {
          handleClockOut();
        } else if (employee) {
          handleClockIn();
        }
      }

      // Map numpad keys when Num Lock is off
      const numpadMap: Record<string, string> = {
        Home: "7",
        ArrowUp: "8",
        PageUp: "9",
        ArrowLeft: "4",
        Clear: "5",
        ArrowRight: "6",
        End: "1",
        ArrowDown: "2",
        PageDown: "3",
        Insert: "0",
        Delete: ".",
      };
      if (numpadMap[num]) {
        setTypedValue((prevValue) => prevValue + numpadMap[num]);
      }
    },
    [setTypedValue, employee, handleClockIn, handleClockOut]
  );

  useEventListener("keyup", handler);

  return (
    <div className="clockinwindow">
      <div className="clockintitle">
        {employee ? (
          <h1>
            Welcome, {employee.firstname} {employee.lastname}
          </h1>
        ) : (
          <h1>{typedValue ? typedValue : "Timeclock"}</h1>
        )}
        {errorMessage && <h6 className="error-message">{errorMessage}</h6>}
      </div>
      <div className="clockinpad">
        {!employee ? (
          <div className="numpadwrapper">
            <Numpad setTypedValue={setTypedValue} />
          </div>
        ) : (
          <div className="clock-entries">
            <div className="action-buttons">
              <button
                className={`clock-button ${
                  employee.open_clock_entry_id ? "clock-out" : "clock-in"
                }`}
                onClick={
                  employee.open_clock_entry_id ? handleClockOut : handleClockIn
                }
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Processing..."
                  : employee.open_clock_entry_id
                  ? "Clock Out"
                  : "Clock In"}
              </button>
              <button className="cancel-button" onClick={clearEmployeeData}>
                Cancel
              </button>
            </div>
            <h3>
              {employee.open_clock_entry_id
                ? `Currently Clocked In: ${currentDuration} hours`
                : "Not Clocked In"}
            </h3>
            <h4>Total Hours This Week: {formatTotalTime(totalDuration)}</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {[...clockEntries].reverse().map((entry) => (
                  <tr
                    key={entry.id}
                    className={!entry.clock_out ? "active-clock-in" : ""}
                  >
                    <td>{moment(entry.clock_in).format("MM/DD")}</td>
                    <td>{moment(entry.clock_in).format("h:mm A")}</td>
                    <td>
                      {entry.clock_out
                        ? moment(entry.clock_out).format("h:mm A")
                        : "Active"}
                    </td>
                    <td>
                      {calculateDuration(entry.clock_in, entry.clock_out)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClockIn;
