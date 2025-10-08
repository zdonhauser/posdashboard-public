import React from "react";
import "./SuggestionsModal.scss";
import * as Types from "../POSWindow/POSTypes";

interface SuggestionsModalProps {
  suggestions: Types.Customer[];
  onSelect: (customer: Types.Customer) => void;
  onClose: () => void;
}

export default function SuggestionsModal({ suggestions, onSelect, onClose }: SuggestionsModalProps) {
  return (
    <div className="suggestions-modal">
      <div className="suggestions-modal-content">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h2>Suggested Customers</h2>
        <ul>
          {suggestions.map((customer) => (
            <li key={customer.id} onClick={() => onSelect(customer)}>
              <div><strong>Name:</strong> {customer.first_name} {customer.last_name}</div>
              <div><strong>Email:</strong> {customer.email}</div>
              <div><strong>Phone:</strong> {customer.phone}</div>
              <div><strong>Company:</strong> {customer.default_address?.company}</div>
              <div><strong>Address:</strong> {customer.default_address?.address1}, {customer.default_address?.city}, {customer.default_address?.province}, {customer.default_address?.zip}, {customer.default_address?.country}</div>
              {customer.store_credit?.amount && (
                <div>
                  <strong>Store Credit:</strong> $
                  {Number(customer.store_credit.amount).toFixed(2)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
