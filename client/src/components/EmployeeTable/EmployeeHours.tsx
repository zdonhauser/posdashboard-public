import React, { useState, useEffect, useRef } from "react";
import "./EmployeeHours.scss";
import moment from "moment-timezone";

interface ClockEntry {
  clock_entry_id: number;
  employee_id: number;
  firstname: string;
  lastname: string;
  email: string;
  clock_in: string;
  clock_out: string | null;
}

interface RecurringEntry {
  id: number;
  employee_id: number;
  type: "hours" | "deduction";
  amount: number;
  description: string;
  start_date: string | null;
  end_date: string | null;
}

const EmployeeHours: React.FC = () => {
  const [reportType, setReportType] = useState<"Daily" | "Weekly">("Daily");
  const [reportDate, setReportDate] = useState(
    moment().tz("America/Chicago").format("YYYY-MM-DD")
  );
  const [reportDateInput, setReportDateInput] = useState(
    moment().tz("America/Chicago").format("YYYY-MM-DD")
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totals, setTotals] = useState({
    totalHoursDecimal: "0.00",
    totalTabs: "0.00",
    totalDeductions: "0.00",
    totalCost: "0.00",
  });
  const [employeeHours, setEmployeeHours] = useState<
    {
      employee_id: number;
      firstname: string;
      lastname: string;
      totalHours: number;
      tabAmount: number;
      deductionAmount: number;
      transactions: {
        orderNumber: string;
        amount: number;
        kind: string;
        date: string;
      }[];
      clockEntries: ClockEntry[];
      hasRecurring: boolean;
      rate: number;
    }[]
  >([]);
  const [detailedClockEntries, setDetailedClockEntries] = useState<
    ClockEntry[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditEntry, setCurrentEditEntry] = useState<ClockEntry | null>(
    null
  );
  const [editedClockIn, setEditedClockIn] = useState<string>("");
  const [editedClockOut, setEditedClockOut] = useState<string>("");
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [newEntryEmployeeId, setNewEntryEmployeeId] = useState<number | null>(
    null
  );
  const [newEntryClockIn, setNewEntryClockIn] = useState<string>(
    moment.tz("America/Chicago").format("YYYY-MM-DDTHH:mm")
  );
  const [newEntryClockOut, setNewEntryClockOut] = useState<string>("");
  const [allEmployees, setAllEmployees] = useState<
    { id: number; firstname: string; lastname: string }[]
  >([]);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [recurringType, setRecurringType] = useState<"hours" | "deduction">(
    "hours"
  );
  const [recurringAmount, setRecurringAmount] = useState("");
  const [recurringDescription, setRecurringDescription] = useState("");
  const [recurringStartDate, setRecurringStartDate] = useState<string>("");
  const [recurringEndDate, setRecurringEndDate] = useState<string>("");
  const [editingRecurringEntry, setEditingRecurringEntry] =
    useState<RecurringEntry | null>(null);
  const [recurringEntries, setRecurringEntries] = useState<RecurringEntry[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  // Ref to hold the current fetch's AbortController
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch("/api/employees", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const employees = await response.json();
          const sortedEmployees = employees.sort((a: any, b: any) =>
            a.firstname.localeCompare(b.firstname)
          );
          setAllEmployees(sortedEmployees);
        } else {
          console.error("Failed to fetch employees.");
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  // Helper to compute a full ISO datetime for clock-out based on clock-in date and selected time,
  // automatically advancing to the next day if the time is earlier than clock-in, and enforcing a 24-hour maximum.
  const computeClockOutDateTime = (
    clockInIso: string,
    clockOutTime: string
  ): string => {
    const clockInMoment = moment(clockInIso); // Clock-in as moment
    // Construct candidate using same date + provided time
    let clockOutMoment = moment(
      `${clockInMoment.format("YYYY-MM-DD")}T${clockOutTime}`
    );
    // If clock-out time is earlier than clock-in, assume next calendar day
    if (clockOutMoment.isBefore(clockInMoment)) {
      clockOutMoment.add(1, "day");
    }
    return clockOutMoment.toISOString();
  };

  // Handles changes to the “Clock Out” time in the “Add New Clock Entry” modal
  const handleNewEntryClockOutChange = (time: string) => {
    if (!newEntryClockIn) return;
    const clockOutIso = computeClockOutDateTime(newEntryClockIn, time);
    const diffHours = moment(clockOutIso).diff(
      moment(newEntryClockIn),
      "hours",
      true
    );
    // Enforce no shifts longer than 24 hours
    if (diffHours > 24) {
      alert("Clock-out time must be within 24 hours of clock-in.");
      return;
    }
    setNewEntryClockOut(clockOutIso);
  };

  // Handles changes to the “Clock Out” time in the “Edit Clock Entry” modal
  const handleEditedClockOutChange = (time: string) => {
    if (!editedClockIn) return;
    const clockOutIso = computeClockOutDateTime(editedClockIn, time);
    console.log("clockOutIso", clockOutIso);
    const diffHours = moment(clockOutIso).diff(
      moment(editedClockIn),
      "hours",
      true
    );
    console.log("diffHours", diffHours);
    if (diffHours > 24) {
      alert("Clock-out time must be within 24 hours of clock-in.");
      return;
    }
    setEditedClockOut(clockOutIso);
  };

  // --- Updated: handleAddNewEntry ---
  const handleAddNewEntry = async () => {
    if (!newEntryEmployeeId || !newEntryClockIn) {
      alert("Please select an employee and provide a clock-in time.");
      return;
    }

    try {
      // Build payload using the computed ISO strings
      const requestBody = {
        clock_in: moment
          .tz(newEntryClockIn, Intl.DateTimeFormat().resolvedOptions().timeZone)
          .toISOString(),
        clock_out: newEntryClockOut || null, // already computed via handler or null
      };

      const response = await fetch(
        `/api/employee/${newEntryEmployeeId}/clock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      if (response.ok) {
        fetchHours(); // Refresh data
        setIsAddEntryModalOpen(false);
      } else {
        console.error(data.error || "Failed to add new entry.");
      }
    } catch (error) {
      console.error("Error adding new entry:", error);
    }
  };

  // --- Updated: handleSaveChanges ---
  const handleSaveChanges = async () => {
    if (!currentEditEntry) return;

    try {
      // Payload now uses computed ISO for edited clock-out
      const payload: { clock_in: string; clock_out: string | null } = {
        clock_in: moment
          .tz(editedClockIn, Intl.DateTimeFormat().resolvedOptions().timeZone)
          .toISOString(),
        clock_out: editedClockOut || null,
      };

      const response = await fetch(
        `/api/employee/clock/${currentEditEntry.clock_entry_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        fetchHours();
        setIsModalOpen(false);
      } else {
        console.error(data.error || "Failed to update clock entry.");
      }
    } catch (error) {
      console.error("Error updating clock entry:", error);
    }
  };

  const handleEditClick = (entry: ClockEntry) => {
    setCurrentEditEntry(entry);

    // Format timestamps for datetime-local input
    const formattedClockIn = moment
      .tz(entry.clock_in, Intl.DateTimeFormat().resolvedOptions().timeZone)
      .format("YYYY-MM-DDTHH:mm");

    setEditedClockIn(formattedClockIn);
    setEditedClockOut(entry.clock_out || "");
    setIsModalOpen(true);
  };

  const handleDeleteClockEntry = async () => {
    if (!currentEditEntry) return;

    try {
      const response = await fetch(
        `/api/clock-entries/${currentEditEntry.clock_entry_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        fetchHours(); // Refresh the data
        setIsModalOpen(false);
        setCurrentEditEntry(null);
        setEditedClockIn("");
        setEditedClockOut("");
      } else {
        console.error("Failed to delete clock entry");
      }
    } catch (error) {
      console.error("Error deleting clock entry:", error);
    }
  };

  useEffect(() => {
    setStartDate("");
    setEndDate("");
    const parseLocalDate = (dateString: string): Date => {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Date(year, month - 1, day); // Month is zero-based
    };

    const selectedDate = parseLocalDate(reportDate);

    if (reportType === "Weekly") {
      const monday = findMonday(selectedDate);
      const sunday = findSunday(selectedDate);
      setStartDate(monday.toISOString().split("T")[0]);
      setEndDate(sunday.toISOString().split("T")[0]);
    } else if (reportType === "Daily") {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setStartDate(formattedDate);
      setEndDate(formattedDate);
    }
  }, [reportType, reportDate]);

  useEffect(() => {
    const calculateTotals = () => {
      let totalHours = 0;
      let totalTabs = 0;
      let totalDeductions = 0;
      let totalCost = 0;

      employeeHours.forEach((emp) => {
        totalHours += emp.totalHours;
        totalTabs += emp.tabAmount;
        totalDeductions += emp.deductionAmount;
        totalCost += emp.totalHours * emp.rate;
      });
      setTotals({
        totalHoursDecimal: totalHours.toFixed(2),
        totalTabs: totalTabs.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        totalCost: totalCost.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      });
    };

    calculateTotals();
  }, [employeeHours]);

  const findMonday = (date: Date): Date => {
    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - diff);
    return monday;
  };

  const findSunday = (date: Date): Date => {
    const day = date.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    const sunday = new Date(date);
    sunday.setDate(date.getDate() + diff);
    return sunday;
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchHours();
    }
  }, [startDate, endDate]);

  const calculateDiffInTime = (
    clock_in_str: string,
    clock_out_str: string | null
  ): string => {
    const inTime = new Date(clock_in_str).getTime();
    const outTime = clock_out_str
      ? new Date(clock_out_str).getTime()
      : new Date().getTime();
    const diff = outTime - inTime;
    return diff !== 0 ? (diff / (1000 * 60 * 60)).toFixed(2) : "0.00";
  };

  const hasActiveClockIn = (entries: ClockEntry[]): boolean => {
    return entries.some((entry) => !entry.clock_out);
  };

  const fetchHours = async () => {
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Create new controller for this fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (!startDate || !endDate) {
      alert("Please enter both start and end dates.");
      return;
    }
    setIsLoading(true);
    try {
      const startFull = `${startDate}T00:00:00`;
      const endFull = `${endDate}T23:59:59`;

      // Fetch all employees
      const employeesResponse = await fetch("/api/employees", {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!employeesResponse.ok) {
        console.error("Failed to fetch employees");
        return;
      }
      const employees = await employeesResponse.json();

      // Fetch clock entries
      const clockResponse = await fetch(
        `/api/clock-entries?start=${encodeURIComponent(
          startFull
        )}&end=${encodeURIComponent(endFull)}`,
        {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (!clockResponse.ok) {
        console.error("Failed to fetch clock entries");
        return;
      }
      const clockEntries: ClockEntry[] = await clockResponse.json();

      // Sort clock entries by first name then last name
      clockEntries.sort((a, b) => {
        if (a.firstname < b.firstname) return -1;
        if (a.firstname > b.firstname) return 1;
        if (a.lastname < b.lastname) return -1;
        if (a.lastname > b.lastname) return 1;
        return 0;
      });
      setDetailedClockEntries(clockEntries);

      // Fetch recurring entries if this is a weekly report
      let recurringEntries: RecurringEntry[] = [];
      if (reportType === "Weekly") {
        const recurringResponse = await fetch("/api/recurring-entries", {
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        if (recurringResponse.ok) {
          recurringEntries = await recurringResponse.json();
          // Filter recurring entries based on start and end dates
          recurringEntries = recurringEntries.filter((entry) => {
            const entryStartDate = entry.start_date
              ? moment(entry.start_date)
              : null;
            const entryEndDate = entry.end_date ? moment(entry.end_date) : null;
            const reportStartMoment = moment(startDate);
            const reportEndMoment = moment(endDate);
            return (
              (!entryStartDate ||
                reportEndMoment.isSameOrAfter(entryStartDate, "day")) &&
              (!entryEndDate ||
                reportStartMoment.isSameOrBefore(entryEndDate, "day"))
            );
          });
          setRecurringEntries(recurringEntries);
        }
      }

      // Fetch transactions for all employees
      const employeeEmails = employees
        .map((emp: any) => emp.email)
        .filter(Boolean);
      const transactionsResponse = await fetch("/api/fetch-transactions", {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          emails: employeeEmails,
          startDate,
          endDate,
        }),
      });

      if (!transactionsResponse.ok) {
        console.error("Failed to fetch transactions");
        return;
      }
      const rawTransactions = await transactionsResponse.json();
      const transactions = rawTransactions.filter((tx) => tx.gateway === "Tab");

      interface EmployeeData {
        hasRecurring: boolean;
        employee_id: number;
        firstname: string;
        lastname: string;
        totalHours: number;
        tabAmount: number;
        deductionAmount: number;
        transactions: any[];
        clockEntries: ClockEntry[];
        rate: number;
      }
      const employeeMap: Record<number, EmployeeData> = {};

      // Initialize employees in the map
      employees.forEach((employee: any) => {
        const { id: employee_id, firstname, lastname } = employee;
        employeeMap[employee_id] = {
          employee_id,
          firstname,
          lastname,
          totalHours: 0,
          tabAmount: 0,
          deductionAmount: 0,
          transactions: [],
          clockEntries: [],
          hasRecurring: false,
          rate: employee.rate,
        };
      });

      // Process clock entries and round each clock entry's hours to two decimals
      clockEntries.forEach((entry) => {
        const { employee_id } = entry;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const clockIn = moment.tz(entry.clock_in, timezone);
        const clockOut = entry.clock_out
          ? moment.tz(entry.clock_out, timezone)
          : moment();
        // Calculate the hours difference and round it to 2 decimals
        const hoursDiff =
          Math.round(clockOut.diff(clockIn, "hours", true) * 100) / 100;
        employeeMap[employee_id].totalHours += hoursDiff;
        employeeMap[employee_id].clockEntries.push(entry);
      });

      // Process recurring entries for weekly reports
      if (reportType === "Weekly") {
        recurringEntries.forEach((entry) => {
          if (employeeMap[entry.employee_id]) {
            const amount = parseFloat(entry.amount as any);
            if (entry.type === "hours") {
              employeeMap[entry.employee_id].totalHours += amount;
              employeeMap[entry.employee_id].hasRecurring = true;
            } else if (entry.type === "deduction") {
              employeeMap[entry.employee_id].deductionAmount += amount;
            }
          }
        });
      }

      // Process transactions
      transactions.forEach((tx) => {
        const employee = employees.find((emp: any) => emp.email === tx.email);
        if (!employee) return;
        const { id: employee_id } = employee;
        const tabTotal =
          tx.kind === "REFUND"
            ? -parseFloat(tx.amountSet.presentmentMoney.amount)
            : parseFloat(tx.amountSet.presentmentMoney.amount);
        employeeMap[employee_id].tabAmount += tabTotal;
        employeeMap[employee_id].transactions.push({
          orderNumber: tx.orderId?.split("/").pop(),
          amount: parseFloat(tx.amountSet.presentmentMoney.amount),
          kind: tx.kind,
          date: tx.createdAt,
        });
      });

      const employeeHoursArray = Object.keys(employeeMap).map((empId) => ({
        employee_id: Number(empId),
        firstname: employeeMap[Number(empId)].firstname,
        lastname: employeeMap[Number(empId)].lastname,
        totalHours: employeeMap[Number(empId)].totalHours,
        tabAmount: employeeMap[Number(empId)].tabAmount,
        deductionAmount: employeeMap[Number(empId)].deductionAmount,
        transactions: employeeMap[Number(empId)].transactions,
        clockEntries: employeeMap[Number(empId)].clockEntries,
        hasRecurring: employeeMap[Number(empId)].hasRecurring,
        rate: employeeMap[Number(empId)].rate,
      }));
      employeeHoursArray.sort((a, b) => a.firstname.localeCompare(b.firstname));
      setEmployeeHours(employeeHoursArray);

      const newTotals = {
        totalHoursDecimal: 0,
        totalTabs: 0,
        totalDeductions: 0,
        totalCost: 0,
      };
      Object.values(employeeMap).forEach((emp) => {
        const hours = typeof emp.totalHours === "number" ? emp.totalHours : 0;
        const tabs = typeof emp.tabAmount === "number" ? emp.tabAmount : 0;
        const deductions =
          typeof emp.deductionAmount === "number" ? emp.deductionAmount : 0;
        // Sum raw hours without rounding each one
        newTotals.totalHoursDecimal += hours;
        newTotals.totalTabs += tabs;
        newTotals.totalDeductions += deductions;
        newTotals.totalCost += hours * emp.rate;
      });
      setTotals({
        totalHoursDecimal: newTotals.totalHoursDecimal.toFixed(2),
        totalTabs: newTotals.totalTabs.toFixed(2),
        totalDeductions: newTotals.totalDeductions.toFixed(2),
        totalCost: newTotals.totalCost.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      });
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === "AbortError") {
        return;
      }
      console.error("Error fetching employee hours and transactions:", error);
    } finally {
      // Only clear loading for the active request
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const formatToUserTimeZone = (datetime: string): string => {
    return moment
      .tz(datetime, Intl.DateTimeFormat().resolvedOptions().timeZone)
      .format("YYYY-MM-DD hh:mm A");
  };

  const handleAddRecurringEntry = async () => {
    if (!selectedEmployeeId || !recurringAmount) {
      alert("Please select an employee and enter amount");
      return;
    }

    try {
      const endpoint = editingRecurringEntry
        ? `/api/recurring-entries/${editingRecurringEntry.id}`
        : "/api/recurring-entries";

      const method = editingRecurringEntry ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          type: recurringType,
          amount: parseFloat(recurringAmount),
          description: recurringDescription,
          start_date: recurringStartDate || null,
          end_date: recurringEndDate || null,
        }),
      });

      if (response.ok) {
        fetchHours(); // Refresh the data
        setIsRecurringModalOpen(false);
        setEditingRecurringEntry(null);
        setSelectedEmployeeId(null);
        setRecurringType("hours");
        setRecurringAmount("");
        setRecurringDescription("");
        setRecurringStartDate("");
        setRecurringEndDate("");
      } else {
        console.error("Failed to save recurring entry");
      }
    } catch (error) {
      console.error("Error saving recurring entry:", error);
    }
  };

  const handleDeleteRecurringEntry = async () => {
    if (!editingRecurringEntry) return;

    try {
      const response = await fetch(
        `/api/recurring-entries/${editingRecurringEntry.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        fetchHours(); // Refresh the data
        setIsRecurringModalOpen(false);
        setEditingRecurringEntry(null);
        setSelectedEmployeeId(null);
        setRecurringType("hours");
        setRecurringAmount("");
        setRecurringDescription("");
        setRecurringStartDate("");
        setRecurringEndDate("");
      } else {
        console.error("Failed to delete recurring entry");
      }
    } catch (error) {
      console.error("Error deleting recurring entry:", error);
    }
  };

  return (
    <div className="hours-container">
      <h1>Employee Hours</h1>
      <div className="date-filters">
        <label>
          Type:
          <select
            value={reportType}
            onChange={(e) =>
              setReportType(e.target.value as "Daily" | "Weekly")
            }
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
          </select>
        </label>
        <label>
          Report Date:
          <input
            type="date"
            value={reportDateInput}
            onChange={(e) => setReportDateInput(e.target.value)}
            onBlur={(e) => setReportDate(e.target.value)}
          />
        </label>
        <button className="no-print" onClick={fetchHours}>
          Refresh
        </button>
      </div>
      {isLoading ? <div className="loading-spinner">Loading...</div> : <></>}
      <table className="employee-hours-table">
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th></th>
            <th>Tabs</th>
            <th>Total Hours</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          {employeeHours
            .filter(
              (employee) =>
                employee.totalHours !== 0 ||
                employee.tabAmount !== 0 ||
                employee.deductionAmount !== 0 ||
                employee.hasRecurring
              //also show all employees with recurring transations even if 0
            )
            .map((emp) => (
              <tr
                key={emp.employee_id}
                className={
                  hasActiveClockIn(emp.clockEntries)
                    ? "active-clock-in"
                    : `${
                        emp.totalHours < 0.1 && !emp.hasRecurring
                          ? "short-entry"
                          : ""
                      }`
                }
              >
                <td>{emp.firstname}</td>
                <td>{emp.lastname}</td>
                <td>
                  {Number(emp.deductionAmount || 0) > 0 && (
                    <>{Number(emp.deductionAmount || 0).toFixed(2)}</>
                  )}
                </td>
                <td>
                  {Number(emp.tabAmount || 0) > 0 && (
                    <strong>{Number(emp.tabAmount || 0).toFixed(2)}</strong>
                  )}
                </td>
                <td className={``}>
                  {Number(emp.totalHours || 0) > 0 && (
                    <strong>{Number(emp.totalHours|| 0).toFixed(2)}</strong>
                  )}
                  {Number(emp.totalHours) === 0 && emp.hasRecurring && (
                    <strong>SALARY</strong>
                  )}
                </td>
                <td>
                  {Number(emp.totalHours || 0) > 0 && (
                    <strong>{Number((emp.totalHours * emp.rate) || 0).toFixed(2)}</strong>
                  )}
                  {Number(emp.totalHours) === 0 && emp.hasRecurring && (
                    <strong>SALARY</strong>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ fontWeight: "bold" }}>
              Totals:
            </td>
            <td style={{ fontWeight: "bold" }}>
              $
              {(
                parseFloat(totals.totalTabs) +
                parseFloat(totals.totalDeductions)
              ).toFixed(2)}
            </td>
            <td style={{ fontWeight: "bold" }}>{totals.totalHoursDecimal}</td>
            <td style={{ fontWeight: "bold" }}>${totals.totalCost}</td>
          </tr>
        </tfoot>
      </table>
      <table className="detailed-clock-entries-table">
        <thead>
          <tr>
            <th colSpan={6}>
              <h2>Detailed Clock Entries</h2>
            </th>
          </tr>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Total Hours</th>
            <th className="no-print">Actions</th>
          </tr>
        </thead>
        <tbody>
          {detailedClockEntries.map((entry) => (
            <tr
              key={entry.clock_entry_id}
              className={`${!entry.clock_out ? "active-clock-in" : ""}`}
            >
              <td>{entry.firstname}</td>
              <td>{entry.lastname}</td>
              <td>{formatToUserTimeZone(entry.clock_in)}</td>
              <td>
                {entry.clock_out
                  ? formatToUserTimeZone(entry.clock_out)
                  : "Still Clocked In"}
              </td>
              <td>
                {calculateDiffInTime(entry.clock_in, entry.clock_out)} hours
              </td>
              <td className="no-print">
                <button
                  className="editButton"
                  onClick={() => handleEditClick(entry)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <table className="tab-transactions-table">
        <thead>
          <tr>
            <th colSpan={5}>
              <h2>Tab Transactions</h2>
            </th>
          </tr>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Order Number</th>
            <th>Date/Time</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {employeeHours.map((emp) =>
            emp.transactions?.map((tx, idx) => (
              <tr key={`${emp.employee_id}-${idx}`}>
                <td>{emp.firstname}</td>
                <td>{emp.lastname}</td>
                <td>{tx.orderNumber}</td>
                <td>{new Date(tx.date).toLocaleString()}</td>
                <td>
                  $
                  {tx.kind === "REFUND"
                    ? (tx.amount * -1).toFixed(2)
                    : tx.amount.toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {reportType === "Weekly" && (
        <>
          <table className="detailed-clock-entries-table">
            <thead>
              <tr>
                <th colSpan={8}>
                  <h2>Recurring Entry Details</h2>
                </th>
              </tr>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th className="no-print">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recurringEntries.map((entry) => {
                const employee = allEmployees.find(
                  (emp) => emp.id === entry.employee_id
                );
                return (
                  <tr key={entry.id}>
                    <td>{employee?.firstname || ""}</td>
                    <td>{employee?.lastname || ""}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {entry.type}
                    </td>
                    <td>
                      {entry.type === "hours"
                        ? entry.amount
                        : `$${entry.amount}`}
                    </td>
                    <td>{entry.description}</td>
                    <td>
                      {entry.start_date
                        ? moment(entry.start_date).format("MM/DD/YYYY")
                        : "N/A"}
                    </td>
                    <td>
                      {entry.end_date
                        ? moment(entry.end_date).format("MM/DD/YYYY")
                        : "N/A"}
                    </td>
                    <td className="no-print">
                      <button
                        className="editButton"
                        onClick={() => {
                          setEditingRecurringEntry(entry);
                          setSelectedEmployeeId(entry.employee_id);
                          setRecurringType(entry.type);
                          setRecurringAmount(entry.amount.toString());
                          setRecurringDescription(entry.description);
                          setRecurringStartDate(
                            entry.start_date
                              ? moment
                                  .tz(entry.start_date, "America/Chicago")
                                  .format("YYYY-MM-DD")
                              : ""
                          );
                          setRecurringEndDate(
                            entry.end_date
                              ? moment
                                  .tz(entry.end_date, "America/Chicago")
                                  .format("YYYY-MM-DD")
                              : ""
                          );
                          setIsRecurringModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      {isModalOpen && currentEditEntry && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Clock Entry</h3>
            <label>
              Clock In:
              <input
                type="datetime-local"
                value={editedClockIn}
                onChange={(e) => setEditedClockIn(e.target.value)}
              />
            </label>
            <label>
              Clock Out:
              <input
                type="time"
                value={editedClockOut?moment(editedClockOut).format("HH:mm") : ""}
                onChange={(e) => handleEditedClockOutChange(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button onClick={handleSaveChanges}>Save Changes</button>
              <button
                onClick={handleDeleteClockEntry}
                style={{ backgroundColor: "#dc3545", color: "white" }}
              >
                Delete Entry
              </button>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="add-entry-section no-print">
        <button
          className="addEntryButton"
          onClick={() => setIsAddEntryModalOpen(true)}
        >
          Add New Clock Entry
        </button>
        {reportType === "Weekly" && (
          <button
            className="addRecurringButton"
            onClick={() => setIsRecurringModalOpen(true)}
          >
            Add Recurring Entry
          </button>
        )}
      </div>

      {isAddEntryModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Clock Entry</h3>
            <label>
              Employee:
              <select
                value={newEntryEmployeeId || ""}
                onChange={(e) => setNewEntryEmployeeId(Number(e.target.value))}
              >
                <option value="" disabled>
                  Select Employee
                </option>
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstname} {emp.lastname}
                  </option>
                ))}
              </select>
            </label>
            <br />
            <label>
              Clock In:
              <input
                type="datetime-local"
                value={newEntryClockIn}
                onChange={(e) => setNewEntryClockIn(e.target.value)}
              />
            </label>
            <br />
            <label>
              Clock Out (Optional):
              <input
                type="time"
                value={
                  newEntryClockOut
                    ? moment(newEntryClockOut).format("HH:mm")
                    : ""
                }
                onChange={(e) => handleNewEntryClockOutChange(e.target.value)}
              />
            </label>
            <br />
            <div className="modal-actions no-print">
              <button onClick={handleAddNewEntry}>Add Entry</button>
              <button onClick={() => setIsAddEntryModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isRecurringModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingRecurringEntry ? "Edit" : "Add"} Recurring Entry</h3>
            <label>
              Employee:
              <select
                value={selectedEmployeeId || ""}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              >
                <option value="">Select Employee</option>
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstname} {emp.lastname}
                  </option>
                ))}
              </select>
            </label>
            <br />
            <label>
              Type:
              <select
                value={recurringType}
                onChange={(e) =>
                  setRecurringType(e.target.value as "hours" | "deduction")
                }
              >
                <option value="hours">Hours</option>
                <option value="deduction">Deduction</option>
              </select>
            </label>
            <br />
            <label>
              Amount:
              <input
                type="number"
                step="0.01"
                value={recurringAmount}
                onChange={(e) => setRecurringAmount(e.target.value)}
              />
            </label>
            <br />
            <label>
              Description:
              <input
                type="text"
                value={recurringDescription}
                onChange={(e) => setRecurringDescription(e.target.value)}
              />
            </label>
            <br />
            <label>
              Start Date:
              <input
                type="date"
                value={recurringStartDate}
                onChange={(e) => setRecurringStartDate(e.target.value)}
              />
            </label>
            <br />
            <label>
              End Date:
              <input
                type="date"
                value={recurringEndDate}
                onChange={(e) => setRecurringEndDate(e.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button onClick={handleAddRecurringEntry}>
                {editingRecurringEntry ? "Save Changes" : "Add Entry"}
              </button>
              {editingRecurringEntry && (
                <button
                  onClick={handleDeleteRecurringEntry}
                  style={{ backgroundColor: "#dc3545", color: "white" }}
                >
                  Delete Entry
                </button>
              )}
              <button
                onClick={() => {
                  setIsRecurringModalOpen(false);
                  setEditingRecurringEntry(null);
                  setSelectedEmployeeId(null);
                  setRecurringType("hours");
                  setRecurringAmount("");
                  setRecurringDescription("");
                  setRecurringStartDate("");
                  setRecurringEndDate("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeHours;
