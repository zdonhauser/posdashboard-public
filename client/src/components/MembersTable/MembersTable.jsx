import React, { useState, useEffect, useRef } from "react";
import "./MembersTable.scss";
import { processSubscriptionData } from "./processSubscriptionData";

const MembersTable = () => {
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [editingMembershipNumber, setEditingMembershipNumber] = useState(null);
  const [editedMember, setEditedMember] = useState({});
  const [nameFilter, setNameFilter] = useState("");
  const [subIdFilter, setSubIdFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [autoRenewFilter, setAutoRenewFilter] = useState(false);
  const [nextPaymentDueOnly, setNextPaymentDueOnly] = useState(false);
  const [termFilter, setTermFilter] = useState(null);
  const [resultsFilter, setResultsFilter] = useState(100);
  const [signupStartFilter, setSignupStartFilter] = useState(null);
  const [signupEndFilter, setSignupEndFilter] = useState(null);
  const [paymentsRemainingFilter, setPaymentsRemainingFilter] = useState(false);
  const [validUntilFilter, setValidUntilFilter] = useState(null);
  const [changedFields, setChangedFields] = useState([]);
  const [onlyWithSubId, setOnlyWithSubId] = useState(true);
  const [sortField, setSortField] = useState("membership_number");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");

  const processedCountRef = useRef(0);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    members,
    nameFilter,
    subIdFilter,
    typeFilter,
    onlyWithSubId,
    sortField,
    sortDirection,
    autoRenewFilter,
    nextPaymentDueOnly,
    paymentsRemainingFilter,
    validUntilFilter,
    termFilter,
    signupStartFilter,
    signupEndFilter,
    resultsFilter,
  ]);

  // Fetch all members from the backend
  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members", {
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch members");
        return;
      }

      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleRefreshMember = async (member) => {
    if (!member.sub_id) {
      alert("This member does not have a subscription ID.");
      return;
    }

    try {
      // Fetch Subscription Details
      const response = await fetch(
        `/api/get-subscription-details/${member.sub_id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        const errorMessage = await response.text();
        console.error("Failed to fetch subscription details:", errorMessage);
        alert(`Error: ${errorMessage}`);
        return;
      }

      const data = await response.json();
      const subscriptionData = data.payload;

      // Process the subscription data to get updated member data
      const updatedMemberData = processSubscriptionData(
        subscriptionData,
        member
      );

      // Fetch Visits Data
      const visitsResponse = await fetch(
        `/api/get-visits?membership_numbers=${member.membership_number}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      if (!visitsResponse.ok) {
        const errorMessage = await visitsResponse.text();
        console.error("Failed to fetch visits:", errorMessage);
        alert(`Error fetching visits: ${errorMessage}`);
        return;
      }

      const visitsData = await visitsResponse.json();

      // Process Visits Data
      const totalVisits = visitsData.length;
      const lastVisitDate =
        visitsData.length > 0 ? visitsData[0].visit_timestamp : null;

      // Update the member data with visits info
      updatedMemberData.visits = totalVisits;
      updatedMemberData.last_visit = lastVisitDate;

      // Compare updatedMemberData with member to find changed fields
      const fieldsChanged = [];
      for (const key in updatedMemberData) {
        if (updatedMemberData[key] !== member[key]) {
          fieldsChanged.push(key);
        }
      }

      // Set editing mode with updated data
      setEditingMembershipNumber(member.membership_number);
      setEditedMember({
        ...member,
        ...updatedMemberData,
        valid_until: formatForInputDate(
          updatedMemberData.valid_until || member.valid_until
        ),
        signup_date: formatForInputDate(
          updatedMemberData.signup_date || member.signup_date
        ),
        valid_starting: formatForInputDate(
          updatedMemberData.valid_starting || member.valid_starting
        ),
        due_date: formatForInputDate(
          updatedMemberData.due_date || member.due_date
        ),
        dob: formatForInputDate(updatedMemberData.dob || member.dob),
        last_visit: formatForInputDate(
          updatedMemberData.last_visit || member.last_visit
        ),
      });
      setChangedFields(fieldsChanged);
    } catch (error) {
      console.error("Error fetching subscription details or visits:", error);
      alert("An error occurred while fetching data.");
    }
  };

  const handleRefreshAndSaveAll = async () => {
    setIsRefreshingAll(true);
    setProgressMessage("Starting refresh and save of all members...");
    processedCountRef.current = 0; // Reset the counter

    // **Group Members by sub_id**
    const subIdToMembersMap = new Map();
    const membersWithoutSubId = [];

    for (const member of filteredMembers) {
      if (!member.sub_id) {
        membersWithoutSubId.push(member);
      } else {
        if (!subIdToMembersMap.has(member.sub_id)) {
          subIdToMembersMap.set(member.sub_id, []);
        }
        subIdToMembersMap.get(member.sub_id).push(member);
      }
    }

    const totalMembers = filteredMembers.length;

    // **Process all members with concurrency limit**
    const allMembersToProcess = [
      ...membersWithoutSubId,
      ...subIdToMembersMap.keys(),
    ];

    // Concurrency control function
    const asyncPool = async (poolLimit, array, iteratorFn) => {
      let i = 0;
      const ret = [];
      const executing = [];
      const enqueue = async () => {
        if (i === array.length) {
          return Promise.resolve();
        }
        const item = array[i++];
        const p = Promise.resolve().then(() => iteratorFn(item));
        ret.push(p);

        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);

        let r = Promise.resolve();
        if (executing.length >= poolLimit) {
          r = Promise.race(executing);
        }
        await r;
        return enqueue();
      };
      await enqueue();
      return Promise.all(ret);
    };

    // **Function to process a member or sub_id group**
    const processItem = async (item) => {
      if (typeof item === "string") {
        // Item is a sub_id
        await processSubId(item);
      } else {
        // Item is a member without sub_id
        await processMemberWithoutSubId(item);
      }
    };

    // **Function to process members without sub_id**
    const processMemberWithoutSubId = async (member) => {
      try {
        setProgressMessage(
          `Processing member ${member.membership_number} (${member.name})... (${
            processedCountRef.current + 1
          } of ${totalMembers})`
        );

        // Fetch Visits Data
        const visitsResponse = await fetch(
          `/api/get-visits?membership_numbers=${member.membership_number}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!visitsResponse.ok) {
          const errorMessage = await visitsResponse.text();
          console.error(
            `Failed to fetch visits for member ${member.membership_number}:`,
            errorMessage
          );
          processedCountRef.current++;
          setProgressMessage(
            `Error fetching visits for member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
          );
          return;
        }

        const visitsData = await visitsResponse.json();

        // Process Visits Data
        const totalVisits = visitsData.length;
        const lastVisitDate =
          visitsData.length > 0 ? visitsData[0].visit_timestamp : null;

        // Update the member data with visits info
        const updatedMember = {
          ...member,
          visits: totalVisits,
          last_visit: lastVisitDate,
        };

        // Prepare the member data for saving
        const memberToSave = {
          ...updatedMember,
          due_date: formatDateForSave(updatedMember.due_date),
          signup_date: formatDateForSave(updatedMember.signup_date),
          valid_starting: formatDateForSave(updatedMember.valid_starting),
          last_visit: formatDateForSave(updatedMember.last_visit),
          valid_until: formatDateForSave(updatedMember.valid_until),
        };

        // Save the updated member data to the backend
        const saveResponse = await fetch(
          `/api/member/${member.membership_number}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
            body: JSON.stringify(memberToSave),
          }
        );

        if (!saveResponse.ok) {
          console.error(`Failed to save member ${member.membership_number}`);
          processedCountRef.current++;
          setProgressMessage(
            `Error saving member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
          );
          return;
        }

        const savedMember = await saveResponse.json();

        // Update the member in the state using functional updates
        setMembers((prevMembers) =>
          prevMembers.map((m) =>
            m.membership_number === member.membership_number ? savedMember : m
          )
        );

        processedCountRef.current++;
        setProgressMessage(
          `Successfully updated member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
        );
      } catch (error) {
        console.error(
          `Error processing member ${member.membership_number}:`,
          error
        );
        processedCountRef.current++;
        setProgressMessage(
          `Error processing member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
        );
      }
    };

    // **Function to process a sub_id group**
    const processSubId = async (sub_id) => {
      const membersWithSubId = subIdToMembersMap.get(sub_id);

      // Fetch Subscription Details once per sub_id
      try {
        const response = await fetch(
          `/api/get-subscription-details/${sub_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json; charset=UTF-8",
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );

        if (!response.ok) {
          const errorMessage = await response.text();
          console.error(
            `Failed to fetch subscription details for sub_id ${sub_id}:`,
            errorMessage
          );
          for (const member of membersWithSubId) {
            processedCountRef.current++;
            setProgressMessage(
              `Error fetching subscription details for member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
            );
          }
          return;
        }

        const data = await response.json();
        const subscriptionData = data.payload;

        // **Process each member sharing this sub_id**
        await Promise.all(
          membersWithSubId.map(async (member) => {
            try {
              // Process the subscription data to get updated member data
              const updatedMemberData = processSubscriptionData(
                subscriptionData,
                member
              );

              // Fetch Visits Data (per member)
              const visitsResponse = await fetch(
                `/api/get-visits?membership_numbers=${member.membership_number}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                  },
                }
              );

              if (!visitsResponse.ok) {
                const errorMessage = await visitsResponse.text();
                console.error(
                  `Failed to fetch visits for member ${member.membership_number}:`,
                  errorMessage
                );
                processedCountRef.current++;
                setProgressMessage(
                  `Error fetching visits for member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
                );
                return;
              }

              const visitsData = await visitsResponse.json();

              // Process Visits Data
              const totalVisits = visitsData.length;
              const lastVisitDate =
                visitsData.length > 0 ? visitsData[0].visit_timestamp : null;

              const paid_per_visit =
                Math.round(
                  (updatedMemberData.total_paid * 100) / (totalVisits || 1)
                ) / 100;

              // Update the member data with visits info
              const updatedMember = {
                ...member,
                ...updatedMemberData,
                visits: totalVisits,
                last_visit: lastVisitDate,
                paid_per_visit: paid_per_visit,
              };

              // Prepare the member data for saving
              const memberToSave = {
                ...updatedMember,
                due_date: formatDateForSave(updatedMember.due_date),
                signup_date: formatDateForSave(updatedMember.signup_date),
                valid_starting: formatDateForSave(updatedMember.valid_starting),
                last_visit: formatDateForSave(updatedMember.last_visit),
                valid_until: formatDateForSave(updatedMember.valid_until),
              };

              // Save the updated member data to the backend
              const saveResponse = await fetch(
                `/api/member/${member.membership_number}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json; charset=UTF-8",
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                  },
                  body: JSON.stringify(memberToSave),
                }
              );

              if (!saveResponse.ok) {
                console.error(
                  `Failed to save member ${member.membership_number}`
                );
                processedCountRef.current++;
                setProgressMessage(
                  `Error saving member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
                );
                return;
              }

              const savedMember = await saveResponse.json();

              // Update the member in the state using functional updates
              setMembers((prevMembers) =>
                prevMembers.map((m) =>
                  m.membership_number === member.membership_number
                    ? savedMember
                    : m
                )
              );

              processedCountRef.current++;
              setProgressMessage(
                `Successfully updated member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
              );
            } catch (error) {
              console.error(
                `Error processing member ${member.membership_number}:`,
                error
              );
              processedCountRef.current++;
              setProgressMessage(
                `Error processing member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
              );
            }
          })
        );
      } catch (error) {
        console.error(`Error processing sub_id ${sub_id}:`, error);
        // Handle all members associated with this sub_id
        for (const member of membersWithSubId) {
          processedCountRef.current++;
          setProgressMessage(
            `Error processing member ${member.membership_number} (${member.name}). (${processedCountRef.current} of ${totalMembers})`
          );
        }
      }
    };

    // **Process all items (members without sub_id and sub_ids) with concurrency limit**
    await asyncPool(10, allMembersToProcess, processItem);

    setProgressMessage("Finished refreshing and saving all members.");
    setIsRefreshingAll(false);
  };

  // Format dates for input fields
  const formatForInputDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getUTCDate()).padStart(2, "0")}`;
  };

  // Apply filters to the members
  const applyFilters = () => {
    let filtered = [...members];

    // Filter by name (case-insensitive)
    if (nameFilter.trim() !== "") {
      const searchTerm = nameFilter.trim().toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name && member.name.toLowerCase().includes(searchTerm)
      );
    }

    if (typeFilter.trim() !== "") {
      const typeTerm = typeFilter.trim().toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.membership_type &&
          member.membership_type.toLowerCase().includes(typeTerm)
      );
    }

    if (validUntilFilter) {
      const validUntilTerm = new Date(validUntilFilter);
      filtered = filtered.filter(
        (member) =>
          !member.valid_until || new Date(member.valid_until) > validUntilTerm
      );
    }

    if (subIdFilter) {
      const idTerm = subIdFilter;
      filtered = filtered.filter(
        (member) =>
          (member.sub_id && member.sub_id === idTerm) ||
          (member.former_sub_id && member.former_sub_id === idTerm)
      );
    }

    // Filter by sub_id
    if (onlyWithSubId) {
      filtered = filtered.filter((member) => member.sub_id);
    }

    // Filter by term
    if (termFilter) {
      filtered = filtered.filter(
        (member) => member.term && member.term.includes(termFilter)
      );
    }

    // Filter by auto-renew status
    if (autoRenewFilter) {
      filtered = filtered.filter(
        (member) => member.status && member.status === autoRenewFilter
      );
    }

    // Filter those with payments remaining
    if (paymentsRemainingFilter) {
      filtered = filtered.filter((member) => member.payments_remaining);
    }

    // Filter by next payment date (today or earlier)
    if (nextPaymentDueOnly) {
      const today = new Date();
      filtered = filtered.filter(
        (member) => member.due_date && new Date(member.due_date) <= today
      );
    }

    // filter by signup date
    if (signupStartFilter || signupEndFilter) {
      const startFilterDate = signupStartFilter
        ? new Date(signupStartFilter)
        : undefined;
      const endFilterDate = signupEndFilter
        ? new Date(signupEndFilter)
        : undefined;
      filtered = filtered.filter((member) => {
        const memberSignUpDate = new Date(member.signup_date);
        return (
          (!startFilterDate || memberSignUpDate >= startFilterDate) &&
          (!endFilterDate || memberSignUpDate <= endFilterDate)
        );
      });
    }

    // Sort by selected field
    if (sortField) {
      filtered.sort((a, b) => {
        let fieldA = a[sortField];
        let fieldB = b[sortField];

        // Handle null or undefined values
        if (fieldA == null && fieldB == null) return 0;
        if (fieldA == null) return sortDirection === "asc" ? -1 : 1;
        if (fieldB == null) return sortDirection === "asc" ? 1 : -1;

        // Handle date fields
        const dateFields = [
          "dob",
          "due_date",
          "contract_end_date",
          "contract_start_date",
          "signup_date",
          "last_visit",
          "valid_until",
        ];

        // Handle numeric fields
        const numericFields = [
          "visits",
          "age",
          "total_paid",
          "payments_remaining",
          "paid_per_visit",
        ];

        let comparison = 0;

        if (dateFields.includes(sortField)) {
          fieldA = new Date(fieldA);
          fieldB = new Date(fieldB);
          comparison = fieldA - fieldB;
        } else if (numericFields.includes(sortField)) {
          fieldA = parseFloat(fieldA);
          fieldB = parseFloat(fieldB);

          // Handle NaN cases
          if (isNaN(fieldA) && isNaN(fieldB)) comparison = 0;
          else if (isNaN(fieldA)) return 1;
          else if (isNaN(fieldB)) return -1;
          else comparison = fieldA - fieldB;
        } else if (typeof fieldA === "string") {
          comparison = fieldA.localeCompare(fieldB);
        } else if (typeof fieldA === "number") {
          comparison = fieldA - fieldB;
        } else {
          comparison = 0;
        }

        // Adjust comparison based on sort direction
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }
    if (resultsFilter) filtered = filtered.slice(0, resultsFilter);
    setFilteredMembers(filtered);
  };

  // Handle edit button click
  const handleEditClick = (member) => {
    setEditingMembershipNumber(member.membership_number);

    setEditedMember({
      ...member,
      dob: formatForInputDate(member.dob),
      due_date: formatForInputDate(member.due_date),
      signup_date: formatForInputDate(member.signup_date),
      valid_starting: formatForInputDate(member.valid_starting),
      last_visit: formatForInputDate(member.last_visit),
      valid_until: formatForInputDate(member.valid_until),
    });
  };

  // Handle cancel button click
  const handleCancelClick = () => {
    setEditingMembershipNumber(null);
    setEditedMember({});
  };

  // Handle input changes in the editable row
  const handleInputChange = (e, field) => {
    let value;
    if (e.target.type === "checkbox") {
      value = e.target.checked;
    } else if (e.target.type === "number") {
      value = parseFloat(e.target.value);
    } else if (e.target.type === "date") {
      value = e.target.value;
    } else {
      value = e.target.value;
    }
    setEditedMember({
      ...editedMember,
      [field]: value,
    });
    //$1("updatedMember: ", editedMember);
  };
  const formatDateForSave = (dateString) => {
    if (!dateString) return null;
    const dateStringWithT =
      typeof dateString === "string" && !dateString.includes("T")
        ? dateString + "T00:00:00"
        : dateString;
    const date = new Date(dateStringWithT);
    if (isNaN(date.getTime())) {
      // Invalid date
      return null;
    }
    return date.toISOString();
  };

  // Handle save button click
  const handleSaveClick = async () => {
    try {
      //$1("editedMember: ", editedMember);
      const memberToSave = {
        ...editedMember,
        // Use the helper function to format date fields
        dob: formatDateForSave(editedMember.dob),
        due_date: formatDateForSave(editedMember.due_date),
        signup_date: formatDateForSave(editedMember.signup_date),
        valid_starting: formatDateForSave(editedMember.valid_starting),
        last_visit: formatDateForSave(editedMember.last_visit),
        valid_until: formatDateForSave(editedMember.valid_until),
      };

      //$1("memberToSave: ", memberToSave);
      const response = await fetch(`/api/member/${editingMembershipNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        body: JSON.stringify(memberToSave),
      });

      if (!response.ok) {
        console.error("Failed to save member");
        return;
      }

      const updatedMember = await response.json();

      // Update the member in the state
      setMembers(
        members.map((member) =>
          member.membership_number === editingMembershipNumber
            ? updatedMember
            : member
        )
      );
      setEditingMembershipNumber(null);
      setEditedMember({});
    } catch (error) {
      console.error("Error saving member:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${
      date.getUTCMonth() + 1
    }/${date.getUTCDate()}/${date.getUTCFullYear()}`;
  };

  return (
    <div className="table-container">
      <h1>Members Management</h1>
      {progressMessage && (
        <div className="progress-message">{progressMessage}</div>
      )}

      {/* Filter Controls */}
      <div className="filter-container">
        <div className="filter-item">
          <label htmlFor="sortField">Sort By:</label>
          <select
            id="sortField"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="membership_number">Membership Number</option>
            <option value="valid_until">Valid Until</option>
            <option value="due_date">Due Date</option>
            <option value="visits">Visits</option>
            <option value="total_paid">Total Paid</option>
            <option value="due_date">Next Payment Date</option>
            <option value="paid_per_visit">Paid Per Visit</option>
            {/* Add more fields as needed */}
          </select>
          <select
            id="sortDirection"
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
            {/* Add more fields as needed */}
          </select>
        </div>
        <br />
        <div className="filter-item">
          <button
            className="refresh-all-button"
            onClick={handleRefreshAndSaveAll}
            disabled={isRefreshingAll}
          >
            {isRefreshingAll ? "Refreshing..." : "Refresh and Save All"}
          </button>
        </div>
        <div className="filter-item">
          <label for="results">Number of Members to Dispay</label>
          <input
            type="number"
            id="results"
            value={resultsFilter}
            onChange={(e) => setResultsFilter(e.target.value)}
          />
        </div>
        <div className="filter-item">
          <label>
            <input
              type="checkbox"
              checked={onlyWithSubId}
              onChange={(e) => setOnlyWithSubId(e.target.checked)}
            />
            Show only members with Sub ID
          </label>
        </div>
      </div>

      <table className="members-table">
        <thead>
          <tr>
            {/* Table Headers */}
            <th>Actions</th>

            <th>Membership Number</th>
            <th>Name</th>
            <th>Membership Type</th>
            <th>Total Paid</th>
            <th>Auto-Renew Status</th>
            <th>Term</th>
            <th>Valid Until</th>
            <th>Next Payment Date</th>
            <th>Required Payments Remaining</th>
            <th>Signup Date</th>
            <th>Valid Starting</th>
            <th>Visits</th>
            <th>Paid Per Visit</th>
            <th>DOB</th>
            <th>Age</th>
            <th>Last Visit</th>
            <th>Address Line 1</th>
            <th>City, State, ZIP</th>
            <th>Comment</th>
            <th>Alert</th>
            <th>Email</th>
            <th>Barcode</th>

            <th>Sub ID</th>
            <th>Customer ID</th>
          </tr>
          <tr>
            {/* Table Headers */}
            <th>
              <button
                className="refresh-all-button"
                onClick={handleRefreshAndSaveAll}
                disabled={isRefreshingAll}
              >
                {isRefreshingAll ? "Refreshing..." : "Refresh"}
              </button>
            </th>
            <th>{filteredMembers.length}</th>
            <th>
              <input
                type="text"
                id="nameFilter"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search..."
              />
            </th>
            <th>
              <input
                type="text"
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                placeholder="Enter type..."
              />
            </th>
            <th>
              $
              {filteredMembers.reduce(
                (total, member) =>
                  Math.round((total + Number(member.total_paid)) * 100) / 100,
                0
              )}
            </th>
            <th>
              <select
                id="autoRenewFilter"
                value={autoRenewFilter}
                onChange={(e) => setAutoRenewFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PAUSED">Paused</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </th>
            <th>
              <input
                type="text"
                id="termFilter"
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                placeholder="Enter term..."
              />
            </th>
            <th>
              <input
                type="date"
                id="dateFilter"
                value={validUntilFilter}
                onChange={(e) => setValidUntilFilter(e.target.value)}
              />
            </th>
            <th>
              <select
                id="overdueFilter"
                value={nextPaymentDueOnly}
                onChange={(e) =>
                  setNextPaymentDueOnly(e.target.value === "true")
                }
              >
                <option value="false">All</option>
                <option value="true">Overdue Only</option>
              </select>
            </th>
            <th>
              <select
                id="paymentsFilter"
                value={paymentsRemainingFilter}
                onChange={(e) =>
                  setPaymentsRemainingFilter(e.target.value === "true")
                }
              >
                <option value="false">All</option>
                <option value="true">&gt; 0</option>
              </select>
            </th>
            <th>
              <input
                type="date"
                id="signupStartFilter"
                value={signupStartFilter}
                onChange={(e) => setSignupStartFilter(e.target.value)}
              />
              <input
                type="date"
                id="signupEndFilter"
                value={signupEndFilter}
                onChange={(e) => setSignupEndFilter(e.target.value)}
              />
            </th>
            <th></th>
            <th>
              {filteredMembers.reduce(
                (total, member) => total + member.visits,
                0
              )}
            </th>
            <th>
              {Math.round(
                (100 *
                  filteredMembers.reduce(
                    (total, member) =>
                      Math.round((total + Number(member.total_paid)) * 100) /
                      100,
                    0
                  )) /
                  filteredMembers.reduce(
                    (total, member) => total + member.visits,
                    0
                  )
              ) / 100}
            </th>
            <th></th>

            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th>
              <input
                type="text"
                id="subIdFilter"
                value={subIdFilter}
                onChange={(e) => setSubIdFilter(e.target.value)}
                placeholder="Search..."
              />
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredMembers.map((member) => {
            const isEditing =
              member.membership_number === editingMembershipNumber;
            return (
              <tr
                key={member.membership_number}
                className={isEditing ? "editing-row" : ""}
              >
                {isEditing ? (
                  <>
                    {/* Editable Fields */}
                    <td>
                      <button className="save-button" onClick={handleSaveClick}>
                        Save
                      </button>
                      <button
                        className="cancel-button"
                        onClick={handleCancelClick}
                      >
                        Cancel
                      </button>
                    </td>
                    <td>{member.membership_number}</td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.name || ""}
                        onChange={(e) => handleInputChange(e, "name")}
                        className={
                          changedFields.includes("name") ? "changed-field" : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.membership_type || ""}
                        onChange={(e) =>
                          handleInputChange(e, "membership_type")
                        }
                        className={
                          changedFields.includes("membership_type")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editedMember.total_paid || ""}
                        onChange={(e) => handleInputChange(e, "total_paid")}
                        className={
                          changedFields.includes("total_paid")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.status || ""}
                        onChange={(e) => handleInputChange(e, "status")}
                        className={
                          changedFields.includes("status")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.term || ""}
                        onChange={(e) => handleInputChange(e, "term")}
                        className={
                          changedFields.includes("term") ? "changed-field" : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editedMember.valid_until || ""}
                        onChange={(e) => handleInputChange(e, "valid_until")}
                        className={
                          changedFields.includes("valid_until")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editedMember.due_date || ""}
                        onChange={(e) => handleInputChange(e, "due_date")}
                        className={
                          changedFields.includes("due_date")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editedMember.payments_remaining || null}
                        onChange={(e) =>
                          handleInputChange(e, "payments_remaining")
                        }
                        className={
                          changedFields.includes("payments_remaining")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        value={editedMember.signup_date || ""}
                        onChange={(e) => handleInputChange(e, "signup_date")}
                        className={
                          changedFields.includes("signup_date")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editedMember.valid_starting || ""}
                        onChange={(e) => handleInputChange(e, "valid_starting")}
                        className={
                          changedFields.includes("valid_starting")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editedMember.visits || 0}
                        onChange={(e) => handleInputChange(e, "visits")}
                        className={
                          changedFields.includes("visits")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editedMember.paid_per_visit || 0}
                        onChange={(e) => handleInputChange(e, "paid_per_visit")}
                        className={
                          changedFields.includes("paid_per_visit")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editedMember.dob || ""}
                        onChange={(e) => handleInputChange(e, "dob")}
                        className={
                          changedFields.includes("dob") ? "changed-field" : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editedMember.age || ""}
                        onChange={(e) => handleInputChange(e, "age")}
                        className={
                          changedFields.includes("age") ? "changed-field" : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={editedMember.last_visit || ""}
                        onChange={(e) => handleInputChange(e, "last_visit")}
                        className={
                          changedFields.includes("last_visit")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.address_line_1 || ""}
                        onChange={(e) => handleInputChange(e, "address_line_1")}
                        className={
                          changedFields.includes("address_line_1")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.city_state_zip || ""}
                        onChange={(e) => handleInputChange(e, "city_state_zip")}
                        className={
                          changedFields.includes("city_state_zip")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.comment || ""}
                        onChange={(e) => handleInputChange(e, "comment")}
                        className={
                          changedFields.includes("comment")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.alert || ""}
                        onChange={(e) => handleInputChange(e, "alert")}
                        className={
                          changedFields.includes("alert") ? "changed-field" : ""
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="email"
                        value={editedMember.email || ""}
                        onChange={(e) => handleInputChange(e, "email")}
                        className={
                          changedFields.includes("email") ? "changed-field" : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.barcode || ""}
                        onChange={(e) => handleInputChange(e, "barcode")}
                        className={
                          changedFields.includes("barcode")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={editedMember.sub_id || ""}
                        onChange={(e) => handleInputChange(e, "sub_id")}
                        className={
                          changedFields.includes("sub_id")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedMember.customer_id || ""}
                        onChange={(e) => handleInputChange(e, "customer_id")}
                        className={
                          changedFields.includes("customer_id")
                            ? "changed-field"
                            : ""
                        }
                      />
                    </td>
                  </>
                ) : (
                  <>
                    {/* Read-Only Fields */}
                    <td>
                      <button
                        className="refresh-button"
                        onClick={() => handleEditClick(member)}
                      >
                        Edit
                      </button>
                      <button
                        className="refresh-button"
                        onClick={() => handleRefreshMember(member)}
                      >
                        Refresh
                      </button>
                    </td>
                    <td>{member.membership_number}</td>
                    <td>{member.name}</td>
                    <td>{member.membership_type}</td>
                    <td>{member.total_paid}</td>
                    <td>{member.status}</td>
                    <td>{member.term}</td>
                    <td>{formatDate(member.valid_until)}</td>
                    <td>{formatDate(member.due_date)}</td>
                    <td>{member.payments_remaining}</td>
                    <td>{formatDate(member.signup_date)}</td>
                    <td>{formatDate(member.valid_starting)}</td>
                    <td>{member.visits}</td>
                    <td>{member.paid_per_visit}</td>
                    <td>{formatDate(member.dob)}</td>
                    <td>{member.age}</td>
                    <td>{formatDate(member.last_visit)}</td>
                    <td>{member.address_line_1}</td>
                    <td>{member.city_state_zip}</td>
                    <td>{member.comment}</td>
                    <td>{member.alert}</td>
                    <td>{member.email}</td>
                    <td>{member.barcode}</td>

                    <td>{member.sub_id}</td>
                    <td>{member.customer_id}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MembersTable;
