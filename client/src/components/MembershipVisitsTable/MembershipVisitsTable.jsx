import React, { useState, useEffect } from 'react';
import './MembershipVisitsTable.scss';

const MembershipVisitsTable = () => {

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [visits, setVisits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, [selectedDate]);

  // Fetch visits for the selected date
  const fetchVisits = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/visits?date=${selectedDate}`, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch visits');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setVisits(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching visits:', error);
      setIsLoading(false);
    }
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };



  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };



// In MembershipVisitsTable.js

const handleDeleteVisit = async (visitId) => {
    if (!window.confirm('Are you sure you want to delete this visit?')) {
      return;
    }
    try {
      const response = await fetch(`/api/visit/${visitId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
  
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Failed to delete visit:', errorMessage);
        alert(`Error: ${errorMessage}`);
        return;
      }
  
      // Remove the deleted visit from the state
      setVisits(visits.filter((visit) => visit.visit_id !== visitId));
      alert('Visit deleted successfully');
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('An error occurred while deleting the visit.');
    }
  };
  

  return (
    <div className="table-container">
      <h1>Membership Visits</h1>

      <div className="date-filter">
        <label htmlFor="visitDate">Select Date:</label>
        <input
          type="date"
          id="visitDate"
          value={selectedDate}
          onChange={handleDateChange}
        />
      </div>

      {isLoading ? (
        <p>Loading visits...</p>
      ) : (
<table className="visits-table">
        <thead>
          <tr>
            <th>Visit ID</th>
            <th>Membership Number</th>
            <th>Name</th>
            <th>Membership Type</th>
            <th>Visit Timestamp</th>
            <th>Actions</th> {/* New Actions column */}
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr key={visit.visit_id}>
              <td>{visit.visit_id}</td>
              <td>{visit.membership_number}</td>
              <td>{visit.name}</td>
              <td>{visit.membership_type}</td>
              <td>{formatTimestamp(visit.visit_timestamp)}</td>
              <td>
                <button onClick={() => handleDeleteVisit(visit.visit_id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
};

export default MembershipVisitsTable;
