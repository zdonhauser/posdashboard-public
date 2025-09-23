import React, { useState, useEffect } from "react";
import "./EmployeeTable.scss";
import { toast } from "react-toastify";
import { useUser } from "../../App";

const EmployeeTable = () => {
	const [employees, setEmployees] = useState<any[]>([]);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editedEmployee, setEditedEmployee] = useState<any>({});
	const [employeeFilter, setEmployeeFilter] = useState("active");
	const [showModal, setShowModal] = useState(false);
	const [newEmployee, setNewEmployee] = useState({
		firstname: "",
		lastname: "",
		middlename: "",
		nickname: "",
		code: "",
		position: "",
		rate: 9,
		email: "",
	});

	//is logged in as manager from usercontext
	const { user } = useUser();


	useEffect(() => {
		fetchEmployees();
	}, []);

	// Fetch all employees, then fetch store credit
	const fetchEmployees = async () => {
		try {
			// Fetch the list of employees
			const response = await fetch("/api/employees", {
				headers: {
					"Content-Type": "application/json; charset=UTF-8",
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
			});

			let employeesData = await response.json();
			// Initialize storeCredit to 0 if not present
			employeesData = employeesData.map((emp) => ({
				...emp,
				storeCredit: {
					amount: null,
					currencyCode: "USD",
				},
			}));

			// sort employees by first name + middle name + last name
			employeesData.sort((a, b) => {
				if (a.firstname < b.firstname) return -1;
				if (a.firstname > b.firstname) return 1;
				if (a.middlename < b.middlename) return -1;
				if (a.middlename > b.middlename) return 1;
				if (a.lastname < b.lastname) return -1;
				if (a.lastname > b.lastname) return 1;
				return 0;
			});

			// Set the employees state first to load the table quickly
			setEmployees(employeesData);

			// For each employee, asynchronously update their store credit using their email
			employeesData.forEach((emp) => {
				if (emp.active)
					updateEmployeeStoreCredit(emp).catch((err) =>
						console.error(`Failed to update credit for ${emp.email}:`, err)
					);
			});
		} catch (error) {
			console.error("Error fetching employees:", error);
		}
	};

	// Helper function to update a single employee's store credit using their email
	const updateEmployeeStoreCredit = async (emp: any): Promise<void> => {
		if (!emp.email) return;
		try {
			const res = await fetch(`/api/customers/${emp.email}/store-credit`, {
				headers: {
					"Content-Type": "application/json; charset=UTF-8",
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
			});

			if (res.status === 404) {
				console.warn(`No Shopify customer found for: ${emp.email}`);
				if (emailRegex.test(emp.email)) {
					console.log(
						`Attempting to create new Shopify customer for ${emp.email}...`
					);
					await createNewShopifyCustomer(emp);
					// Update employee storeCredit to zero
					setEmployees((prevEmployees) =>
						prevEmployees.map((e) =>
							e.email === emp.email
								? {
										...e,
										storeCredit: { amount: 0, currencyCode: "USD", id: null },
								  }
								: e
						)
					);
					return;
				} else {
					console.warn(`Invalid email format for: ${emp.email}`);
					setEmployees((prevEmployees) =>
						prevEmployees.map((e) =>
							e.email === emp.email ? { ...e, storeCredit: null } : e
						)
					);
					return;
				}
			}

			if (!res.ok) {
				console.warn(
					`Error fetching store credit, status: ${res.status} for ${emp.email}`
				);
				setEmployees((prevEmployees) =>
					prevEmployees.map((e) =>
						e.email === emp.email
							? {
									...e,
									storeCredit: { amount: 0, currencyCode: "USD", id: null },
							  }
							: e
					)
				);
				return;
			}

			const storeCreditData = await res.json();
			setEmployees((prevEmployees) =>
				prevEmployees.map((e) =>
					e.email === emp.email
						? {
								...e,
								storeCredit: {
									amount: Number(storeCreditData.balance),
									currencyCode: storeCreditData.currencyCode,
									id: storeCreditData.id,
								},
						  }
						: e
				)
			);
		} catch (error) {
			console.error(`Error fetching store credit for ${emp.email}:`, error);
			setEmployees((prevEmployees) =>
				prevEmployees.map((e) =>
					e.email === emp.email ? { ...e, storeCredit: null } : e
				)
			);
		}
	};

	// Regex for basic email validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const fetchStoreCreditForEmployees = async (employeeList: any[]) => {
		return Promise.all(
			employeeList.map(async (emp) => {
				// Skip if no email
				if (!emp.email) {
					return { ...emp, storeCredit: null };
				}

				try {
					// Try to fetch store credit for this employee's email
					const res = await fetch(`/api/customers/${emp.email}/store-credit`, {
						headers: {
							"Content-Type": "application/json; charset=UTF-8",
							Authorization: `Bearer ${sessionStorage.getItem("token")}`,
						},
					});

					// 404 means "No Shopify customer" => optionally create new
					if (res.status === 404) {
						console.warn(`No Shopify customer found for: ${emp.email}`);
						if (emailRegex.test(emp.email)) {
							console.log(
								`Attempting to create new Shopify customer for ${emp.email}...`
							);
							await createNewShopifyCustomer(emp);
							return {
								...emp,
								storeCredit: { amount: 0, currencyCode: "USD", id: null },
							};
						} else {
							console.warn(`Invalid email format for: ${emp.email}`);
							return {
								...emp,
								storeCredit: null,
							};
						}
					}

					// If another error code, default to zero or null
					if (!res.ok) {
						console.warn(
							`Error fetching store credit, status: ${res.status} for ${emp.email}`
						);
						return {
							...emp,
							storeCredit: { amount: 0, currencyCode: "USD", id: null },
						};
					}

					// Otherwise parse successful store credit response
					const storeCreditData = await res.json();
					return {
						...emp,
						storeCredit: {
							amount: storeCreditData.balance,
							currencyCode: storeCreditData.currencyCode,
							id: storeCreditData.id,
						},
					};
				} catch (error) {
					console.error(`Error fetching store credit for ${emp.email}:`, error);
					// Fallback: no store credit set
					return { ...emp, storeCredit: null };
				}
			})
		);
	};

	// Helper function to create a new Shopify customer
	const createNewShopifyCustomer = async (employee: any) => {
		try {
			const response = await fetch("/api/customer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json; charset=UTF-8",
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
				body: JSON.stringify({
					firstName: employee.firstname || employee.first_name || "New",
					lastName: employee.lastname || employee.last_name || "Employee",
					email: employee.email,
				}),
			});

			if (!response.ok) {
				console.error(
					`Failed to create new Shopify customer for ${employee.email}`
				);
				return null;
			}

			const data = await response.json();
			console.log("New Shopify customer created:", data.shopifyCustomer);
			return data.shopifyCustomer;
		} catch (error) {
			console.error("Error creating new Shopify customer:", error);
			return null;
		}
	};

	// Enter edit mode for an employee
	const handleEditClick = (employee: any) => {
		setEditingId(employee.id);
		setEditedEmployee({
			...employee,
			// store original credit and initialize newStoreCredit to current amount (or 0)
			originalStoreCredit: employee.storeCredit?.amount || 0,
			newStoreCredit: employee.storeCredit?.amount || 0,
		});
	};

	// Cancel editing
	const handleCancelClick = () => {
		setEditingId(null);
		setEditedEmployee({});
	};

	// Handle input changes for the edited employee
	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
		field: string
	) => {
		let value: any;
		if (e.target.type === "checkbox") {
			value = (e.target as HTMLInputElement).checked;
		} else if (e.target.type === "number") {
			value = parseFloat(e.target.value);
		} else {
			value = e.target.value;
		}
		setEditedEmployee((prev: any) => ({
			...prev,
			[field]: value,
		}));
	};

	// Save changes for the employee
	const handleSaveClick = async () => {
		if (!editingId) return;

		try {
			// 1. Calculate credit delta
			const original = editedEmployee.originalStoreCredit || 0;
			const updated = editedEmployee.newStoreCredit || 0;
			const delta = updated - original;
			let updatedCredit: any = null;
			if (delta !== 0 && editedEmployee.storeCredit?.id) {
				// perform credit update: positive delta = credit, negative = debit
				const type = delta > 0 ? "credit" : "debit";
				updatedCredit = await handleStoreCreditUpdate(
					editedEmployee.storeCredit.id,
					Math.abs(delta),
					type
				);
			}

			// 2. Save employee details
			const { originalStoreCredit, newStoreCredit, ...employeeData } = editedEmployee;
			const response = await fetch(`/api/employee/${editingId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json; charset=UTF-8",
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
				body: JSON.stringify(employeeData),
			});

			if (!response.ok) {
				console.error("Failed to save employee");
				return;
			}

			const updatedEmployee = await response.json();

			if (updatedCredit) {
				updatedEmployee.storeCredit = updatedCredit;
			}

			// 3. Update employees list in state
			setEmployees((prev) =>
				prev.map((emp) => (emp.id === editingId ? updatedEmployee : emp))
			);

			setEditingId(null);
			setEditedEmployee({});
		} catch (error) {
			console.error("Error saving employee:", error);
		}
	};

	const handleStoreCreditUpdate = async (
		storeCreditOrCustomerId: string,
		amount: number,
		type: "credit" | "debit"
	) => {
		if (!storeCreditOrCustomerId || !amount) {
			console.log("Missing ID or amount for store credit operation.");
			return null;
		}
		try {
			const response = await fetch(
				`/api/customers/${encodeURIComponent(
					storeCreditOrCustomerId
				)}/store-credit`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json; charset=UTF-8",
						Authorization: `Bearer ${sessionStorage.getItem("token")}`,
					},
					body: JSON.stringify({
						amount: amount.toString(),
						currencyCode: "USD",
						type: type,
					}),
				}
			);

			if (!response.ok) {
				console.error("Failed to update store credit");
				return null;
			}

			const data = await response.json();

			// Now update your UI
			const updatedCredit = {
				amount: data.balance.amount,
				currencyCode: data.balance.currencyCode,
				id: data.id, // might be store credit account ID
			};

			setEmployees((prev) =>
				prev.map((emp) => {
					// If your logic is to match by ID in memory or something else
					// For example, if this is the currently editing employee:
					if (emp.id === editingId) {
						return {
							...emp,
							storeCredit: updatedCredit,
						};
					}
					return emp;
				})
			);
			return updatedCredit;
		} catch (error) {
			console.error("Error updating store credit:", error);
			return null;
		}
	};

	const handleInputChangeNewEmployee = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target;
		const checked = (e.target as HTMLInputElement).checked;
		setNewEmployee((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmitNewEmployee = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const response = await fetch("/api/employee", {
				method: "POST",
				headers: {
					"Content-type": "application/json; charset=UTF-8",
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
				body: JSON.stringify(newEmployee),
			});
			if (response.ok) {
				toast.success("Employee created successfully");
				setShowModal(false);
				// Optionally, refresh the employee list here
				fetchEmployees();
			} else {
				toast.error("Error creating employee");
			}
		} catch (error) {
			console.error("Error creating employee:", error);
			toast.error("Error creating employee");
		}
	};

	const filteredEmployees = employees.filter((emp) => {
		if (employeeFilter === "all") return true;
		if (employeeFilter === "active") return emp.active;
		if (employeeFilter === "inactive") return !emp.active;
		return true;
	});

	return (
		<div className="table-container">
			<h1>Employee Management</h1>
			<div className="employee-filter">
				<label htmlFor="employeeFilterSelect">Show: </label>
				<select
					id="employeeFilterSelect"
					value={employeeFilter}
					onChange={(e) => setEmployeeFilter(e.target.value)}
				>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
					<option value="all">All</option>
				</select>
			</div>
			<br />
			<button
				className="add-employee-button"
				onClick={() => setShowModal(true)}
			>
				Add Employee
			</button>
			<br />
			<table className="employee-table">
				<thead>
					<tr className={editingId ? "tr-in-edit-mode hide-header" : ""}>
						<th className="edit-only-column">ID</th>
						<th>First Name</th>
						<th>Last Name</th>
						<th>Middle</th>
						<th> Nickname</th>
						<th className="edit-only-column">Access</th>
						<th>Email</th>
						<th className="edit-only-column">Admin</th>
						<th className="edit-only-column">Manager</th>
						<th className="edit-only-column">Food Discount</th>
						<th className="edit-only-column">Discount</th>
						<th className="edit-only-column">Position</th>
						<th className={`${user.admin ? "" : "edit-only-column"}`}>Rate</th>
						<th className="edit-only-column">Active</th>
						<th>Actions</th>
						<th>Store Credit Balance</th>
					</tr>
				</thead>
				<tbody>
					{filteredEmployees.map((employee) => {
						const isEditing = employee.id === editingId;

						return (
							<tr
								key={employee.id}
								className={
									isEditing
										? "tr-in-edit-mode"
										: editingId
										? "not-editing-row"
										: ""
								}
							>
								<td className="id-column edit-only-column">{employee.id}</td>
								{isEditing ? (
									<>
										<td>
											First Name:
											<input
												type="text"
												value={editedEmployee.firstname || ""}
												onChange={(e) => handleInputChange(e, "firstname")}
											/>
										</td>
										<td>
											Last Name:
											<input
												type="text"
												value={editedEmployee.lastname || ""}
												onChange={(e) => handleInputChange(e, "lastname")}
											/>
										</td>
										<td>
											Middle Name:
											<input
												type="text"
												value={editedEmployee.middlename || ""}
												onChange={(e) => handleInputChange(e, "middlename")}
											/>
										</td>
										<td>
											Nickname:
											<input
												type="text"
												value={editedEmployee.nickname || ""}
												onChange={(e) => handleInputChange(e, "nickname")}
											/>
										</td>
										<td>
											Code:
											<input
												type="text"
												value={editedEmployee.code || ""}
												onChange={(e) => handleInputChange(e, "code")}
											/>
										</td>
										<td>
											Email:
											<input
												type="text"
												value={editedEmployee.email || ""}
												onChange={(e) => handleInputChange(e, "email")}
											/>
										</td>
										<td>
                      <label>
											Admin:
											<input
												type="checkbox"
												checked={editedEmployee.admin || false}
												onChange={(e) => handleInputChange(e, "admin")}
											/>
                      </label>
										</td>
										<td>
                      <label>
											Manager:
											<input
												type="checkbox"
												checked={editedEmployee.manager || false}
												onChange={(e) => handleInputChange(e, "manager")}
											/>
                      </label>
										</td>
										<td>
											Food Discount:
											<input
												type="number"
												value={editedEmployee.fooddiscount || 0}
												onChange={(e) => handleInputChange(e, "fooddiscount")}
											/>
										</td>
										<td>
											Discount:
											<input
												type="number"
												value={editedEmployee.discount || 0}
												onChange={(e) => handleInputChange(e, "discount")}
											/>
										</td>
										<td>
											Position:
											<select
												value={editedEmployee.position || ""}
												onChange={(e) => handleInputChange(e, "position")}
											>
												<option value="">Select Position</option>
												<option value="Ride Operator">Ride Operator</option>
												<option value="Front">Front</option>
												<option value="Kitchen">Kitchen</option>
												<option value="Janitorial">Janitorial</option>
												<option value="Maintenance">Maintenance</option>
											</select>
										</td>
										<td className="rate-input-cell">
											<div className="rate-input-container">
												Rate:
												<input
													type="number"
													value={editedEmployee.rate || ""}
													onChange={(e) => handleInputChange(e, "rate")}
												/>
											</div>
										</td>
										<td>
                      <label>
											Active:
											<input
												type="checkbox"
												checked={editedEmployee.active}
												onChange={(e) => handleInputChange(e, "active")}
											/>
                      </label>
										</td>

										{/* Store credit single input in editing mode */}
										<td style={{ textAlign: "center" }}>
											<label style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
												Store Credit:
												<input
													type="number"
													value={editedEmployee.newStoreCredit}
													onChange={(e) =>
														setEditedEmployee((prev: any) => ({
															...prev,
															newStoreCredit: parseFloat(e.target.value) || 0,
														}))
													}
													style={{ width: "100px", marginTop: "0.25rem", textAlign: "center" }}
												/>
											</label>
										</td>
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
									</>
								) : (
									<>
										<td>{employee.firstname}</td>
										<td>{employee.lastname}</td>
										<td className="middle-name-column">
											{employee.middlename}
										</td>
										<td>{employee.nickname}</td>
										<td className="edit-only-column">{employee.code}</td>
										<td>{employee.email}</td>
										<td className="edit-only-column">
											{employee.admin ? "Yes" : "No"}
										</td>
										<td className="edit-only-column">
											{employee.manager ? "Yes" : "No"}
										</td>
										<td className="edit-only-column">
											{employee.fooddiscount}
										</td>
										<td className="edit-only-column">{employee.discount}</td>
										<td className="edit-only-column">{employee.position}</td>
										<td className={`${user.admin ? "" : "edit-only-column"}`}>{employee.rate}</td>
										<td>
											<button
												className="edit-button"
												onClick={() => handleEditClick(employee)}
											>
												Edit
											</button>
										</td>
										{/* Display store credit in read-only mode */}
										<td style={{ textAlign: "center" }}>
											{employee.storeCredit?.amount !== null
												? employee.storeCredit?.amount > 0
													? `$${Number(
															employee.storeCredit.amount || 0
													  ).toFixed(2)}`
													: ""
												: "—"}
										</td>
									</>
								)}
							</tr>
						);
					})}
				</tbody>
			</table>
			{showModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h2>Create New Employee</h2>
						<form onSubmit={handleSubmitNewEmployee}>
							<label>
								First Name:
								<input
									type="text"
									name="firstname"
									value={newEmployee.firstname}
									onChange={handleInputChangeNewEmployee}
									required
								/>
							</label>
							<br />
							<label>
								Last Name:
								<input
									type="text"
									name="lastname"
									value={newEmployee.lastname}
									onChange={handleInputChangeNewEmployee}
									required
								/>
							</label>
							<br />
							<label>
								Middle Name:
								<input
									type="text"
									name="middlename"
									value={newEmployee.middlename}
									onChange={handleInputChangeNewEmployee}
								/>
							</label>
							<br />
							<label>
								Nickname:
								<input
									type="text"
									name="nickname"
									value={newEmployee.nickname}
									onChange={handleInputChangeNewEmployee}
								/>
							</label>
							<br />
							<label>
								Email:
								<input
									type="text"
									name="email"
									value={newEmployee.email}
									onChange={handleInputChangeNewEmployee}
								/>
							</label>
							<br />
							<label>
								Code:
								<input
									type="text"
									name="code"
									value={newEmployee.code}
									onChange={handleInputChangeNewEmployee}
								/>
							</label>
							<br />
							<label>
								Position:
								<select
									name="position"
									value={newEmployee.position}
									onChange={handleInputChangeNewEmployee}
								>
									<option value="">Select Position</option>
									<option value="Ride Operator">Ride Operator</option>
									<option value="Front">Front</option>
									<option value="Kitchen">Kitchen</option>
									<option value="Janitorial">Janitorial</option>
									<option value="Maintenance">Maintenance</option>
								</select>
							</label>
							<br />
							<label>
								Rate:
								<input
									type="number"
									name="rate"
									value={newEmployee.rate}
									onChange={handleInputChangeNewEmployee}
								/>
								<span className="rate-hint">
									<p>Starting Pay</p>
									<p>High School: $9.00 / High School Kitchen: $10.50</p>
									<p>Grad: $11.00 / Grad Kitchen: $12.50</p>
								</span>
							</label>
							<br />

							<div className="modal-buttons">
								<button type="submit">Create</button>
								<button type="button" onClick={() => setShowModal(false)}>
									Cancel
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default EmployeeTable;
