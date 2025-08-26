import React, { useState, useEffect } from 'react';
import './GiftCardTable.scss';

const GiftCardTable = () => {
    const [giftCards, setGiftCards] = useState([]);
    const [filteredGiftCards, setFilteredGiftCards] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editedGiftCard, setEditedGiftCard] = useState({});
    const [isDonationFilter, setIsDonationFilter] = useState('all');
    const [issuedToFilter, setIssuedToFilter] = useState('');
    const [redeemedFilter, setRedeemedFilter] = useState('all');
    const [displayNumberFilter,setDisplayNumberFilter] = useState(100)
    const [showAddForm, setShowAddForm] = useState(false);
    const [cardNumberFilter, setCardNumberFilter] = useState('');
    const [excludeNullIssueTimestamp, setExcludeNullIssueTimestamp] = useState(true);
    const [newGiftCardData, setNewGiftCardData] = useState({
        issued_to: '',
        is_donation: false,
        notes: '',
        items: 'Unlimited Wristband',
        card_numbers: '',
        expiration: '',
        valid_starting:'',
      });
    const [sortBy, setSortBy] = useState('issue_timestamp');

    useEffect(() => {
        fetchGiftCards();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [giftCards, isDonationFilter, issuedToFilter, redeemedFilter, cardNumberFilter, excludeNullIssueTimestamp,displayNumberFilter, sortBy]);
    

    // Fetch all gift cards from the backend
    const fetchGiftCards = async () => {
        try {
            const response = await fetch('/api/giftcards', {
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                console.error('Failed to fetch gift cards');
                return;
            }

            const data = await response.json();
            setGiftCards(data);
        } catch (error) {
            console.error('Error fetching gift cards:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...giftCards];
    
        // Exclude records with null issue_timestamp by default
        if (excludeNullIssueTimestamp) {
            filtered = filtered.filter(gc => gc.issue_timestamp);
        }
    
        // Filter by is_donation
        if (isDonationFilter !== 'all') {
            const isDonation = isDonationFilter === 'true';
            filtered = filtered.filter(gc => gc.is_donation === isDonation);
        }
    
        // Filter by issued_to (case-insensitive)
        if (issuedToFilter.trim() !== '') {
            const searchTerm = issuedToFilter.trim().toLowerCase();
            filtered = filtered.filter(gc =>
                gc.issued_to && gc.issued_to.toLowerCase().includes(searchTerm)
            );
        }
    
        // Filter by card_number (case-insensitive)
        if (cardNumberFilter.trim() !== '') {
            const searchTerm = cardNumberFilter.trim().toLowerCase();
            filtered = filtered.filter(gc =>
                gc.card_number && gc.card_number.toLowerCase().includes(searchTerm)
            );
        }
    
        // Filter by redeemed status
        if (redeemedFilter !== 'all') {
            if (redeemedFilter === 'redeemed') {
                filtered = filtered.filter(gc => gc.redeem_timestamp);
            } else if (redeemedFilter === 'not_redeemed') {
                filtered = filtered.filter(gc => !gc.redeem_timestamp);
            }
        }
    
        // Sort by selected column
        filtered.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
          
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
          
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              return bVal.localeCompare(aVal); // descending
            }
          
            return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
          });
          
        // Limit display to displayNumberFilter results
        if(displayNumberFilter) filtered = filtered.slice(0, displayNumberFilter);

        setFilteredGiftCards(filtered);
    };
    

    // Handle edit button click
    const handleEditClick = (giftCard) => {
        setEditingId(giftCard.card_id);

        // Format dates for input fields
        const formatForInputDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const isoString = date.toISOString();
            return isoString.split('T')[0]; // 'YYYY-MM-DD'
        };

        const formatForInputDateTime = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            const isoString = date.toISOString();
            return isoString.substring(0, 16); // 'YYYY-MM-DDTHH:MM'
        };

        setEditedGiftCard({
            ...giftCard,
            expiration: formatForInputDate(giftCard.expiration),
            redeem_timestamp: formatForInputDateTime(giftCard.redeem_timestamp),
            valid_starting: formatForInputDate(giftCard.valid_starting),
        });
    };

    // Handle cancel button click
    const handleCancelClick = () => {
        setEditingId(null);
        setEditedGiftCard({});
    };

    // Handle input changes in the editable row
    const handleInputChange = (e, field) => {
        let value;
        if (e.target.type === 'checkbox') {
            value = e.target.checked;
        } else if (e.target.type === 'number') {
            value = parseFloat(e.target.value);
        } else if (e.target.type === 'date' || e.target.type === 'datetime-local') {
            value = e.target.value;
        } else {
            value = e.target.value;
        }
        setEditedGiftCard({
            ...editedGiftCard,
            [field]: value,
        });
    };

    // Handle save button click
    const handleSaveClick = async () => {
        try {
            const giftCardToSave = {
                ...editedGiftCard,
                // Convert date fields to ISO strings or desired format
                expiration: editedGiftCard.expiration ? new Date(editedGiftCard.expiration).toISOString() : null,
                redeem_timestamp: editedGiftCard.redeem_timestamp ? new Date(editedGiftCard.redeem_timestamp).toISOString() : null,
                valid_starting: editedGiftCard.valid_starting ? new Date(editedGiftCard.valid_starting).toISOString() : null,
            };

            const response = await fetch(`/api/giftcard/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
                body: JSON.stringify(giftCardToSave),
            });

            if (!response.ok) {
                console.error('Failed to save gift card');
                return;
            }

            const updatedGiftCard = await response.json();

            // Update the gift card in the state
            setGiftCards(giftCards.map(gc => gc.card_id === editingId ? updatedGiftCard : gc));
            setEditingId(null);
            setEditedGiftCard({});
        } catch (error) {
            console.error('Error saving gift card:', error);
        }
    };

    // Handle delete button click
    const handleDeleteClick = async (card_id) => {
        if (!window.confirm('Are you sure you want to delete this gift card?')) {
            return;
        }
        try {
            const response = await fetch(`/api/giftcard/${card_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                console.error('Failed to delete gift card');
                return;
            }

            // Remove the gift card from the state
            setGiftCards(giftCards.filter(gc => gc.card_id !== card_id));
        } catch (error) {
            console.error('Error deleting gift card:', error);
        }
    };

    // Format timestamp fields
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    // Format date fields
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };


    // Handle new gift card input changes
    const handleNewGiftCardInputChange = (e, field) => {
        let value;
        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else {
          value = e.target.value;
        }
        setNewGiftCardData({
          ...newGiftCardData,
          [field]: value,
        });
      };
      
      

    // Handle adding new gift cards
    const handleAddGiftCards = async () => {
        try {
          // Validate inputs
          const cardNumbersInput = newGiftCardData.card_numbers.trim();
          if (!cardNumbersInput) {
            alert('Please enter at least one card number.');
            return;
          }
      
          const cardNumbersArray = cardNumbersInput
            .split('\n')
            .map((num) => num.trim())
            .filter((num) => num !== '');
      
          if (cardNumbersArray.length === 0) {
            alert('Please enter at least one valid card number.');
            return;
          }
      
          // Prepare the data to send to the backend
          const dataToSend = {
            issued_to: newGiftCardData.issued_to,
            is_donation: newGiftCardData.is_donation,
            notes: newGiftCardData.notes,
            items: newGiftCardData.items,
            card_numbers: cardNumbersArray,
            expiration: newGiftCardData.expiration
              ? new Date(newGiftCardData.expiration).toISOString()
              : null,
            valid_starting: newGiftCardData.valid_starting
            ? new Date(newGiftCardData.valid_starting).toISOString()
            : null,
          };
      
          const response = await fetch('/api/giftcards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
              'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            },
            body: JSON.stringify(dataToSend),
          });
      
          if (!response.ok) {
            const errorMessage = await response.text();
            console.error('Failed to add gift cards:', errorMessage);
            alert(`Error: ${errorMessage}`);
            return;
          }
      
          const newGiftCards = await response.json();
      
          // Update the gift cards list and re-apply filters
          setGiftCards([...giftCards, ...newGiftCards]);
      
          // Reset the form and hide it
          setNewGiftCardData({
            issued_to: '',
            is_donation: false,
            notes: '',
            items: 'Unlimited Wristband',
            card_numbers: '',
            expiration: '',
            valid_starting: '',
          });
          setShowAddForm(false);
        } catch (error) {
          console.error('Error adding gift cards:', error);
        }
      };
      
      


    return (
        <div className="table-container">
            <h1>Gift Card Management</h1>

    {/* Filter Controls */}
    <div className="filter-container">
    {/* Existing filters */}
    <div className="filter-item">
      <label htmlFor="isDonationFilter">Filter by Donation:</label>
      <select
        id="isDonationFilter"
        value={isDonationFilter}
        onChange={(e) => setIsDonationFilter(e.target.value)}
      >
        <option value="all">All</option>
        <option value="true">Donations Only</option>
        <option value="false">Non-Donations Only</option>
      </select>
    </div>
    <div className="filter-item">
      <label htmlFor="issuedToFilter">Search Issued To:</label>
      <input
        type="text"
        id="issuedToFilter"
        value={issuedToFilter}
        onChange={(e) => setIssuedToFilter(e.target.value)}
        placeholder="Enter name..."
      />
    </div>
    <div className="filter-item">
      <label htmlFor="redeemedFilter">Filter by Redeemed Status:</label>
      <select
        id="redeemedFilter"
        value={redeemedFilter}
        onChange={(e) => setRedeemedFilter(e.target.value)}
      >
        <option value="all">All</option>
        <option value="redeemed">Redeemed Only</option>
        <option value="not_redeemed">Not Redeemed Only</option>
      </select>
    </div>
    <div className="filter-item">
    <label htmlFor="cardNumberFilter">Search Card Number:</label>
    <input
        type="text"
        id="cardNumberFilter"
        value={cardNumberFilter}
        onChange={(e) => setCardNumberFilter(e.target.value)}
        placeholder="Enter card number..."
    />
    </div>
    <div className="filter-item">
    <label htmlFor="displayNumber">Display Number:</label>
    <input
        type="number"
        id="displayNumber"
        value={displayNumberFilter}
        onChange={(e) => setDisplayNumberFilter(e.target.value)}
    />
    </div>
<div className="filter-item">
    <label htmlFor="excludeNullIssueTimestamp">
        <input
            type="checkbox"
            id="excludeNullIssueTimestamp"
            checked={excludeNullIssueTimestamp}
            onChange={(e) => setExcludeNullIssueTimestamp(e.target.checked)}
        />
        Exclude Legacy Cards
    </label>
</div>
<div className="filter-item">
    <label htmlFor="sortBy">Sort By:</label>
    <select
        id="sortBy"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
    >
        <option value="issue_timestamp">Issue Timestamp</option>
        <option value="redeem_timestamp">Redeem Timestamp</option>
        <option value="issued_to">Issued To</option>
        <option value="card_number">Card Number</option>
        <option value="expiration">Expiration</option>
    </select>
</div>

    {/* Toggle Add Form Button */}
    <button
      className="toggle-add-form-button"
      onClick={() => setShowAddForm(!showAddForm)}
    >
      {showAddForm ? 'Cancel Adding Gift Cards' : 'Add Gift Cards'}
    </button>
  </div>

  {/* Conditionally render the Add Gift Cards Form */}
  {showAddForm && (
    <div className="add-giftcard-form">
      <h2>Add New Gift Cards</h2>
      <div className="form-group">
        <label htmlFor="issued_to">Issued To:</label>
        <input
          type="text"
          id="issued_to"
          value={newGiftCardData.issued_to}
          onChange={(e) => handleNewGiftCardInputChange(e, 'issued_to')}
        />
      </div>
      <div className="form-group">
        <label htmlFor="items">Items:</label>
        <input
          type="text"
          id="items"
          value={newGiftCardData.items}
          onChange={(e) => handleNewGiftCardInputChange(e, 'items')}
        />
      </div>
      <div className="form-group">
        <label htmlFor="is_donation">Is Donation:</label>
        <input
          type="checkbox"
          id="is_donation"
          checked={newGiftCardData.is_donation}
          onChange={(e) => handleNewGiftCardInputChange(e, 'is_donation')}
        />
      </div>
      <div className="form-group">
        <label htmlFor="notes">Notes:</label>
        <input
          type="text"
          id="notes"
          value={newGiftCardData.notes}
          onChange={(e) => handleNewGiftCardInputChange(e, 'notes')}
        />
      </div>
      <div className="form-group">
        <label htmlFor="expiration">Expiration Date:</label>
        <input
          type="date"
          id="expiration"
          value={newGiftCardData.expiration}
          onChange={(e) => handleNewGiftCardInputChange(e, 'expiration')}
        />
      </div>
      <div className="form-group">
        <label htmlFor="valid_starting">Valid Starting:</label>
        <input
          type="date"
          id="valid_starting"
          value={newGiftCardData.valid_starting}
          onChange={(e) => handleNewGiftCardInputChange(e, 'valid_starting')}
        />
      </div>
      <div className="form-group">
        <label htmlFor="card_numbers">Card Numbers (one per line):</label>
        <textarea
          id="card_numbers"
          value={newGiftCardData.card_numbers}
          onChange={(e) => handleNewGiftCardInputChange(e, 'card_numbers')}
          placeholder="Enter card numbers, one per line"
        ></textarea>
      </div>
      <button className="add-button" onClick={handleAddGiftCards}>
        Submit Gift Cards
      </button>
    </div>
  )}

            <table className="giftcard-table">
                <thead>
                    <tr>
                        {/* Table Headers */}
                        <th>Card ID</th>
                        <th>Card Number</th>
                        <th>Issued To</th>
                        <th>Items</th>
                        <th>Is Donation</th>
                        <th>Issue Timestamp</th>
                        <th>Redeem Timestamp</th>
                        <th>Notes</th>
                        <th>Paid Amount</th>
                        <th>Original Value</th>
                        <th>Current Value</th>
                        <th>Expiration</th>
                        <th>Valid Starting</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredGiftCards.map(giftCard => {
                        const isEditing = giftCard.card_id === editingId;
                        return (
                            <tr key={giftCard.card_id} className={isEditing ? 'editing-row' : ''}>
                                {isEditing ? (
                                    <>
                                        {/* Editable Fields */}
                                        <td>{giftCard.card_id}</td>
                                        <td>{giftCard.card_number}</td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editedGiftCard.issued_to || ''}
                                                onChange={(e) => handleInputChange(e, 'issued_to')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editedGiftCard.items || ''}
                                                onChange={(e) => handleInputChange(e, 'items')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={editedGiftCard.is_donation || false}
                                                onChange={(e) => handleInputChange(e, 'is_donation')}
                                            />
                                        </td>
                                        <td>{formatTimestamp(giftCard.issue_timestamp)}</td>
                                        <td>
                                            <input
                                                type="datetime-local"
                                                value={editedGiftCard.redeem_timestamp || ''}
                                                onChange={(e) => handleInputChange(e, 'redeem_timestamp')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                value={editedGiftCard.notes || ''}
                                                onChange={(e) => handleInputChange(e, 'notes')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedGiftCard.paid_amount || 0}
                                                onChange={(e) => handleInputChange(e, 'paid_amount')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedGiftCard.original_value || 0}
                                                onChange={(e) => handleInputChange(e, 'original_value')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editedGiftCard.current_value || 0}
                                                onChange={(e) => handleInputChange(e, 'current_value')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                value={editedGiftCard.expiration || ''}
                                                onChange={(e) => handleInputChange(e, 'expiration')}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="date"
                                                value={editedGiftCard.valid_starting || ''}
                                                onChange={(e) => handleInputChange(e, 'valid_starting')}
                                            />
                                        </td>
                                        <td>
                                            <button className="save-button" onClick={handleSaveClick}>Save</button>
                                            <button className="cancel-button" onClick={handleCancelClick}>Cancel</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        {/* Read-Only Fields */}
                                        <td>{giftCard.card_id}</td>
                                        <td>{giftCard.card_number}</td>
                                        <td>{giftCard.issued_to}</td>
                                        <td>{giftCard.items}</td>
                                        <td>{giftCard.is_donation ? 'Yes' : 'No'}</td>
                                        <td>{formatTimestamp(giftCard.issue_timestamp)}</td>
                                        <td>{formatTimestamp(giftCard.redeem_timestamp)}</td>
                                        <td>{giftCard.notes}</td>
                                        <td>{giftCard.paid_amount}</td>
                                        <td>{giftCard.original_value}</td>
                                        <td>{giftCard.current_value}</td>
                                        <td>{formatDate(giftCard.expiration)}</td>
                                        <td>{formatDate(giftCard.valid_starting)}</td>
                                        <td>
                                            <button className="edit-button" onClick={() => handleEditClick(giftCard)}>Edit</button>
                                            <button className="delete-button" onClick={() => handleDeleteClick(giftCard.card_id)}>Delete</button>
                                        </td>
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

export default GiftCardTable;
