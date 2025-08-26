import React, { useState, useRef, useEffect } from "react";
import "./CustomerPanel.scss";
import useEventListener from "../EventListener/EventListener";
import * as Types from "../POSWindow/POSTypes";
import SuggestionsModal from "../SuggestionsModal/SuggestionsModal";
import { usePOS } from "../../contexts/POSContext";
//import { useUser } from "../../App";


export default function CustomerPanel() {
  const {
    customer,
    setCustomer,
    address,
    setAddress,
    discountCodes,
    setDiscountCodes,
    taxExempt,
    setTaxExempt,
    orderNumber,
    clearOrder,
    suggestedCustomers,
    setSuggestedCustomers,
    employeeResults,
    setEmployeeResults,
    typedValue,
    setTypedValue,
    emailReceipt,
    setEmailReceipt,
    mode
  } = usePOS();
  //const { user } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingDiscount, setIsAddingDiscount] = useState(false);
  const [contactFirstName, setContactFirstName] = useState(
    customer?.first_name || ""
  );
  const [contactLastName, setContactLastName] = useState(
    customer?.last_name || ""
  );
  const [contactCompany, setContactCompany] = useState(address?.company || "");
  const [contactEmail, setContactEmail] = useState(customer?.email || "");
  const [contactPhone, setContactPhone] = useState(customer?.phone || "");
  const [customerId, setCustomerId] = useState(customer?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showEmployeeResults, setShowEmployeeResults] = useState(false);

  useEffect(() => {
    setContactFirstName(customer?.first_name || "");
    setContactLastName(customer?.last_name || "");
    setContactCompany(address?.company || "");
    setContactEmail(customer?.email || "");
    setContactPhone(customer?.phone || "");
    setCustomerId(customer?.id || "");
  }, [customer, address]);

  useEffect(() => {
    // Fetch store credit when the customer is saved
    if ((customer?.id || customer?.email) && !customer?.store_credit) {
      fetch(`/api/customers/${customer.id||customer.email}/store-credit`, {
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      })
        .then((res) => res.json())
        .then((response) => {
          if (response.balance) {
            //add store_credit prop to setCustomer
            setCustomer({ ...customer, store_credit: {
              amount: response.balance,
              currencyCode: response.currencyCode,
              id: response.id,
            } });
          }
        })
        .catch((error) => {
          console.error("Error fetching store credit:", error);
        });
    }
  }, [customer]);

  const customerRef = useRef(null);

  useEffect(() => {
    if (showEmployeeResults) {
      handleSearchEmployees();
    }
  }, [typedValue]);

  useEffect(() => {
    if (isEditing) {
      customerRef.current.focus();
    }
  }, [isEditing]);

  const handleSearchCustomers = (searchQuery: string) => {
    fetch(`/api/search-customers`, {
      method: "POST",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
      body: JSON.stringify({ query: searchQuery }),
    })
      .then((res) => res.json())
      .then(async (response) => {
        const customersWithCredit = await Promise.all(
          response.customers.map(async (customer) => {
            if (customer.id || customer.email) {
              try {
                const creditResponse = await fetch(
                  `/api/customers/${customer.id || customer.email}/store-credit`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                    },
                  }
                );
                if (creditResponse.ok) {
                  const creditData = await creditResponse.json();
                  customer.store_credit = {
                    amount: creditData.balance,
                    currencyCode: creditData.currencyCode,
                    id: creditData.id,
                  };
                }
              } catch (error) {
                console.error("Error fetching store credit for customer:", error);
              }
            }
            return customer;
          })
        );
        setSuggestedCustomers(customersWithCredit);
        setShowSuggestions(true);
      })
      .catch((error) => console.error("Error fetching customers:", error));
  };

  const handleSearchEmployees = () => {
    fetch(`/api/search-employees?query=${encodeURIComponent(typedValue)}&active=true`, {
      method: "GET",
      headers: {
        "Content-type": "application/json; charset=UTF-8",
        Authorization: `Bearer ${sessionStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then((response) => {
        setEmployeeResults(response);
        setShowEmployeeResults(true); // Show the employee results modal
      })
      .catch((error) => console.error("Error fetching employees:", error));
  };

  const handleEmployeeSelection = (employee) => {
    setCustomer({
      first_name: employee.nickname || employee.firstname,
      last_name: employee.lastname,
      tax_exempt: false,
      tags: "employee",
      email: !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
        employee.email
      )
        ? undefined
        : employee.email,
    });
    setAddress({
      first_name: employee.first_name,
      last_name: employee.last_name,
    });
    setAddress({
      first_name: employee.firstname,
      last_name: employee.lastname,
      country_code: "US",
    });
    setDiscountCodes([
      {
        code: "EMPLOYEE",
        amount: employee.discount || 20,
        type: "percentage",
        categories: [
          {
            category: "food",
            discount: employee.fooddiscount || 40,
          },
          {
            category: "drinks",
            discount: 100,
            max_quantity: 1,
          },
          {
            category: "bottled drinks",
            discount: 40,
          },
        ],
      },
    ]);
    setShowEmployeeResults(false);
    setTypedValue("");
  };

  const handleCustomerSelection = (customer: Types.Customer) => {
    console.log('customer:', customer)
    setCustomer(customer);
    setAddress(customer.default_address || {});
    setContactFirstName(customer.first_name || "");
    setContactLastName(customer.last_name || "");
    setContactCompany(customer.default_address?.company || "");
    setContactEmail(customer.email || "");
    setContactPhone(customer.phone || "");
    setCustomerId(customer.id || "");
    setSuggestedCustomers([]);
    setShowSuggestions(false);
    setTaxExempt(customer.tax_exempt || false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: string) => void
  ) => {
    const value = e.target.value;
    setter(value);
    setSearchQuery(value);
    handleSearchCustomers(value);
  };

  const toggleEdit = () => {
    if (isEditing) {
      saveEdit();
    } else {
      if (!customer.first_name&&!customer.email&&!customer.company) {
        setEmailReceipt(true);
      }
      setIsEditing(true);
    }
  };

  const toggleAddDiscount = (discount?: Types.DiscountCode) => {
    if (isAddingDiscount && discount) {
      saveDiscount(discount);
    } else if (isAddingDiscount && !discount) {
      setIsAddingDiscount(false);
      //$1("removing add discount");
    } else {
      setIsAddingDiscount(true);
    }
  };

  const saveDiscount = (discount: Types.DiscountCode) => {
    setDiscountCodes([...discountCodes, discount]);
    setIsAddingDiscount(false);
  };

  const saveEdit = () => {
    // Build the address object
    const address: Types.Address = {
      first_name: contactFirstName,
      last_name: contactLastName,
      company: contactCompany,
      phone: contactPhone,
      country_code: "US",
    };
  
    // Remove empty props from address
    Object.keys(address).forEach((key) => {
      if (!address[key]) {
        delete address[key];
      }
    });
  
    // Only save if we have at least something for email, firstName or company
    if (contactEmail || contactFirstName || contactCompany) {
      // Create a temporary updatedCustomer object
      const updatedCustomer: Types.Customer = {
        ...customer,
        email: !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
          contactEmail
        )
          ? undefined
          : contactEmail,
        first_name: contactFirstName || (contactCompany ? contactCompany : undefined),
        last_name: contactLastName || undefined,
        phone: contactPhone || undefined,
        tax_exempt: taxExempt || false,
      };
  
      // Set the address in state
      setAddress({
        first_name: contactFirstName,
        last_name: contactLastName,
        company: contactCompany,
        phone: contactPhone,
        country_code: "US",
      });
  
      // If you already have an ID for this customer (i.e. customer update vs. creation),
      // you could attach it here:
      // updatedCustomer.id = customer.id || yourNewlyCreatedIdFromBackend;
  
      // Set the customer in state
      setCustomer(updatedCustomer);
    }
  
    // End editing mode
    setIsEditing(false);
  
    // If email is invalid, disable email receipt
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(contactEmail)) {
      setEmailReceipt(false);
    }
  };
  

  const clearCustomer = () => {
    setAddress({});
    setCustomer({});
  };

  const enterhandler = (event: KeyboardEvent) => {
    const key = event.key;
    if (key === "Enter" && isEditing) {
      saveEdit();
    }
  };

  useEventListener("keyup", enterhandler);

  if (isEditing) {
    return (
      <>
        <div className="modal-backdrop"></div>
        <div className="modal-container">
          <div key={"customerpanel"} className="editCustomer">
            <b>Customer</b> <sup onClick={toggleEdit}>[x]</sup>
            <div className="customerInfo" id="customerinfo">
              <b>First Name </b>
              <br />
              <input
                ref={customerRef}
                type="text"
                value={contactFirstName}
                onChange={(e) => handleInputChange(e, setContactFirstName)}
              ></input>
              <br />
              <b>Last Name </b>
              <br />
              <input
                type="text"
                value={contactLastName}
                onChange={(e) => handleInputChange(e, setContactLastName)}
              ></input>
              <br />
              <b>Company </b>
              <br />
              <input
                type="text"
                value={contactCompany}
                onChange={(e) => handleInputChange(e, setContactCompany)}
              ></input>
              <br />
              <b>Phone Number </b>
              <br />
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => handleInputChange(e, setContactPhone)}
              ></input>
              <br />
              <b>Email Address </b>
              <br />
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => handleInputChange(e, setContactEmail)}
              ></input>
              {contactEmail &&
                !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(
                  contactEmail
                ) && (
                  <span style={{ color: "red" }}>
                    <br />
                    Invalid email address format
                  </span>
                )}
              <br />
              <br />
              <label htmlFor="taxExempt">Tax Exempt</label>
              <input
                type="checkbox"
                id="taxExempt"
                name="taxExempt"
                checked={taxExempt}
                onChange={(e) => setTaxExempt(e.target.checked)}
              />
              <br />
              <br />
              <label htmlFor="emailreceipt">Email Receipt?</label>
              <input
                type="checkbox"
                id="emailreceipt"
                name="emailreceipt"
                checked={emailReceipt}
                onChange={(e) => setEmailReceipt(e.target.checked)}
              />
            </div>
            <span onClick={saveEdit}>Save</span>
          </div>
          {showSuggestions && (
            <SuggestionsModal
              suggestions={suggestedCustomers}
              onSelect={handleCustomerSelection}
              onClose={() => setShowSuggestions(false)}
            />
          )}
        </div>
      </>
    );
  } else if (isAddingDiscount) {
    return (
      <>
        <div className="modal-backdrop"></div>
        <div className="modal-container">
          <div key={"customerpanel"} className="editCustomer">
            <b>Add Discount</b>{" "}
            <sup onClick={() => toggleAddDiscount()}>[x]</sup>
            <div className="customerInfo" id="customerinfo"></div>
            <button
              onClick={() =>
                toggleAddDiscount({
                  code: "PREMIUM",
                  amount: 20,
                  type: "percentage",
                })
              }
            >
              Premium Discount
            </button>
            <br />
            <button
              onClick={() =>
                toggleAddDiscount({
                  code: "EMPLOYEE",
                  amount: 40,
                  type: "percentage",
                })
              }
            >
              Employee Discount
            </button>
            <br />
            <label htmlFor="custom-discount-amount">Custom $ Discount</label>
            <input
              id="custom-discount-amount"
              type="number"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const input = e.target as HTMLInputElement;
                  const val = parseFloat(input.value);
                  if (!isNaN(val)) {
                    toggleAddDiscount({
                      code: `$${val} Off`,
                      amount: val,
                      type: "fixed_amount",
                    });
                  }
                }
              }}
            />
            <br />
            <label htmlFor="custom-discount-percent">Custom % Discount</label>
            <input
              id="custom-discount-percent"
              type="number"
              max="100"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const input = e.target as HTMLInputElement;
                  const pval = parseFloat(input.value);
                  if (!isNaN(pval) && pval <= 100) {
                    toggleAddDiscount({
                      code: `${pval}% Off`,
                      amount: pval,
                      type: "percentage",
                    });
                  }
                }
              }}
            />
            <br />
          </div>
        </div>
      </>
    );
  } else {
    return (
      <div key={"customerpanel"} className="customerWrapper">
        {!orderNumber && Object.keys(customer).length > 0 ? (
          <>
            <button
              id="addCustomerButton"
              className="addCustomerButton"
              onClick={toggleEdit}
            >
              <i>
                {(customer.first_name || customer.last_name) ? 
                  `${customer.first_name} ${customer.last_name}` : 
                  (customer.email ? customer.email : customer.id)}
              </i>
            </button>
            <button
              id="removeCustomerButton"
              className="addCustomerButton"
              onClick={_e=>{
                setCustomer({})
                setEmailReceipt(false)
              }}
            >
              Remove Customer
            </button>
            {customer.store_credit?.amount && (
            <div className="storeCreditInfo">
              <b>Store Credit:</b> ${Number(customer.store_credit.amount).toFixed(2)}
            </div>
          )}
          </>
        ) : orderNumber ? (
          <button
            id="addCustomerButton"
            className="addCustomerButton"
            onClick={() => clearOrder(false, false)}
          >
            Start New Order
          </button>
        ) : mode === "front" ? (
          <React.Fragment key="add-customer-buttons">
            <button
              id="addCustomerButton"
              className="addCustomerButton"
              onClick={toggleEdit}
            >
              Add Customer
            </button>
            <button
              id="addEmployeeButton"
              className="addCustomerButton"
              onClick={handleSearchEmployees}
            >
              Add Employee
            </button>
          </React.Fragment>
        ) : null}

        {showEmployeeResults && (
          <div className="modal-backdrop">
            <div className="modal-container">
              <div className="employeeResults">
                <input
                  type="text"
                  onChange={(e) => {
                    setTypedValue(e.target.value);
                  }}
                  value={typedValue}
                />
                <br />
                <b>Employee Results</b>{" "}
                <sup onClick={() => setShowEmployeeResults(false)}>[x]</sup>
                <ul>
                  {Array.isArray(employeeResults) &&
                    employeeResults.map((employee, index) => (
                      <li
                        key={index}
                        onClick={() => handleEmployeeSelection(employee)}
                      >
                        {employee.firstname} {employee.nickname}{" "}
                        {employee.lastname}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
