import React, { useState, useEffect, useRef } from "react";
import "./PaymentButtons.scss";
import * as Types from "../POSWindow/POSTypes";
import { usePOS } from "../../contexts/POSContext";
import { toast } from "react-toastify";
//import { useUser } from "../../App";
//import { KDSOrderItem } from "../POSWindow/POSTypes";

export default function PaymentButtons() {
	const {
		createOrder,
		transactions,
		setTransactions,
		subtotalPrice,
		taxLines,
		totalPrice,
		orderId,
		fulfillAllOrders,
		fulfilled,
		discountCodes,
		setDiscountCodes,
		changeAmount,
		setChangeAmount,
		typedValue,
		setTypedValue,
		clearOrder,
		orderNotes,
		setOrderNotes,
		addNotesToOrder,
		updateOrder,
		cancelAllFuls,
		fulOrders,
		fulfillWithOptions,
		lineItems,
		orderNumber,
		isSubmitting,
		customer,
		setCurrentTab,
		kdsOrderItems,
		printTicket,
		mode,
		setSubmissionMessage,
		
	} = usePOS();

	//const { user } = useUser();

	const [reprintable, setReprintable] = useState(false);
	const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
	const [fulfillmentSelections, setFulfillmentSelections] = useState<{
		[key: number]: boolean;
	}>({});

	const [payWindow, setPayWindow] = useState(false);
	const [typedPaymentValue, setTypedPaymentValue] = useState<number>(0);
	const [convertedPaymentValue, setConvertedPaymentValue] = useState<number>(0);
	const [amountDue, setAmountDue] = useState<number>(0);
	const [showChangeModal, setShowChangeModal] = useState(false);
	const [editingOrderNotes, setEditingOrderNotes] = useState(false);
	const [cancellingOrder, setCancellingOrder] = useState(false);
	const [cancelAmount, setCancelAmount] = useState<number | undefined>(
		undefined
	);
	const [refundOrder, setRefundOrder] = useState<boolean>(true);
	const [restockOrder, setRestockOrder] = useState<boolean>(true);
	const [cancelReason, setCancelReason] = useState<string | undefined>(
		undefined
	);
	const [totalPaid, setTotalPaid] = useState<number>(0);
	const [fulOptions, setFulOptions] = useState(false);
	const [fulfilledQuantities, setFulfilledQuantities] = useState({});
	const [notifyCustomer, setNotifyCustomer] = useState(true);
	const [printReceipt, setPrintReceipt] = useState(false);
	const [localKdsItems, setLocalKdsItems] = useState<Types.KDSOrderItem[]>([]);

	const paymentRef = useRef<HTMLInputElement>(null);
	const convertedValueRef = useRef(convertedPaymentValue);
	const orderIdRef = useRef(orderId);
	const amountDueRef = useRef(amountDue);
	const totalPriceRef = useRef(totalPrice);
	const transactionsRef = useRef(transactions);

	// Automatically apply May merchandise discount during the promotion period
	useEffect(() => {
		const now = new Date();
		// Months are zero-based: 4 = May
		const promoStart = new Date(2025, 4, 1);
		const promoEnd = new Date(2025, 4, 31, 23, 59, 59);

		if (now >= promoStart && now <= promoEnd) {
			// If not already applied, push the May merch discount
			if (!discountCodes.some((dc) => dc.code === "MAYMERCH")) {
				const newDiscount: Types.DiscountCode = {
					code: "MAYMERCH",
					amount: 0,
					type: "percentage",
					categories: [{ category: "merchandise", discount: 10 }],
				};
				const prevDiscountsShallow = [...discountCodes];
				prevDiscountsShallow.push(newDiscount);
				setDiscountCodes(prevDiscountsShallow);
			}
		}
	}, [discountCodes, setDiscountCodes]);

	useEffect(() => {
		orderIdRef.current = orderId;
	}, [orderId]);

	useEffect(() => {
		amountDueRef.current = amountDue;
	}, [amountDue]);

	useEffect(() => {
		totalPriceRef.current = totalPrice;
	}, [totalPrice]);

	useEffect(() => {
		convertedValueRef.current = convertedPaymentValue;
	}, [convertedPaymentValue]);

	useEffect(() => {
		transactionsRef.current = transactions;
	}, [transactions]);

	useEffect(() => {
		// Initialize local KDS items from computed kdsOrderItems
		setLocalKdsItems([...kdsOrderItems]);
	}, [kdsOrderItems]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				orderIdRef.current ||
				totalPriceRef.current === 0 ||
				amountDueRef.current === 0
			) {
				return;
			}
			if (e.code === "NumpadAdd") {
				handlePayment("Cash");
			} else if (e.code === "NumpadSubtract") {
				handlePayment("Quickbooks Payments");
			} else if (e.code === "NumpadMultiply") {
				handlePayment("Tab");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	useEffect(() => {
		const strippedValue = typedValue.replace(/[+\-*]/g, "");
		const numeric = Number(strippedValue);
		if (!isNaN(numeric)) {
			setTypedPaymentValue(numeric);
			const converted = strippedValue.includes(".") ? numeric : numeric / 100;
			setConvertedPaymentValue(converted);
		} else {
			setTypedPaymentValue(0);
			setConvertedPaymentValue(0);
		}
	}, [typedValue]);

	useEffect(() => {
		if (payWindow) {
			const timer = setTimeout(() => {
				if (paymentRef.current) {
					paymentRef.current.focus();
				}
			}, 0); // Ensure the focus call is pushed to the end of the event queue
			return () => clearTimeout(timer);
		}
	}, [payWindow]);

	useEffect(() => {
		function isMobileDevice() {
			return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent
			);
		}

		const handleClick = (event: MouseEvent) => {
			if (
				(event.target as HTMLElement).tagName !== "INPUT" &&
				paymentRef.current &&
				document.contains(paymentRef.current) &&
				(event.target as HTMLElement).closest(".paymentModal") // Check if the click was not within an element with the class "paymentModal"
			) {
				paymentRef.current.focus();
			}
		};

		if (!isMobileDevice()) {
			document.addEventListener("click", handleClick);
			//console.log("not a mobile device!");
		} else {
			//console.log("is mobile.");
		}

		// Cleanup the event listener when the component unmounts
		return () => {
			if (!isMobileDevice()) {
				document.removeEventListener("click", handleClick);
			}
		};
	}, []); // focus on the payment input always when modal

	useEffect(() => {
		/*console.log(
      "amount due: ",
      amountDue,
      "total price: ",
      totalPrice,
      "transactions: ",
      transactions
    );*/
		const transactionsTotal = transactions.reduce(
			(sum, transaction) =>
				sum +
				(transaction?.kind === "sale" ? transaction.amount || 0 : 0) -
				(transaction?.kind === "refund" ? transaction.amount || 0 : 0) -
				(transaction?.kind === "change" ? transaction.amount || 0 : 0),
			0
		);

		setAmountDue(Number((totalPrice - transactionsTotal).toFixed(2)));
	}, [convertedPaymentValue, totalPrice, amountDue]); //keep amountDue updated

	useEffect(() => {
		//console.log('calculating amount due for change from transactions: ',transactions,'and total price: ',totalPrice)
		const transactionsTotal = Number(
			transactions
				.reduce(
					(sum, transaction) =>
						sum +
						(transaction?.kind === "sale" ? transaction.amount || 0 : 0) -
						(transaction?.kind === "refund" ? transaction.amount || 0 : 0) -
						(transaction?.kind === "change" ? transaction.amount || 0 : 0),
					0
				)
				.toFixed(2)
		);
		//console.log('transactions total: ',transactionsTotal)
		setTotalPaid(transactionsTotal);
		setCancelAmount(transactionsTotal);
		setAmountDue(Number((totalPrice - transactionsTotal).toFixed(2)));
		// Check if the transactions total matches totalPrice and totalPrice isn't 0
		//$1('transactions total: ', transactionsTotal, 'total price: ', totalPrice, 'transactions: ', transactions)

		const filteredTransactions = transactions.filter(
			(transaction) =>
				transaction?.gateway !== "Store Credit" && transaction?.kind === "sale"
		);

		if (
			transactionsTotal === totalPrice &&
			filteredTransactions.length > 0 &&
			!orderId
		) {
			setPayWindow(false);
			handleOrderSubmission();
		} else if (
			filteredTransactions.length > 0 &&
			transactionsTotal > totalPrice
		) {
			//console.log('transactions total:', transactionsTotal, 'total price:', totalPrice, 'change:', (transactionsTotal - totalPrice));
			handleChange(transactionsTotal - totalPrice);
		}
	}, [transactions]); //after transaction, checks if finished paying or change needed

	useEffect(() => {
		//dont apply store credit on a completed order
		if (orderId) {
			return;
		}

		//console.log("Checking and applying store credit...");

		const existingStoreCreditTransactionIndex = transactions.findIndex(
			(tx) => tx.gateway === "Store Credit" && tx.kind === "sale"
		);

		// If no customer or no store credit, remove any existing store credit transaction
		if (!customer || !customer.store_credit) {
			if (existingStoreCreditTransactionIndex >= 0) {
				const updatedTransactions = transactions.filter(
					(_, index) => index !== existingStoreCreditTransactionIndex
				);
				setTransactions(updatedTransactions);
				//console.log("Removed store credit transaction due to missing customer or store credit.");
			}
			return;
		}

		const storeCreditAmount = parseFloat(customer.store_credit.amount || "0");

		// If no store credit or no total to pay, ensure no store credit transaction exists
		if (storeCreditAmount <= 0 || totalPrice <= 0) {
			if (existingStoreCreditTransactionIndex >= 0) {
				const updatedTransactions = transactions.filter(
					(_, index) => index !== existingStoreCreditTransactionIndex
				);
				setTransactions(updatedTransactions);
				//console.log("Removed store credit transaction due to no available store credit or total price.");
			}
			return;
		}

		//console.log('Existing Store Credit Transaction Index:', existingStoreCreditTransactionIndex);

		// If no store credit transaction exists, add it
		if (existingStoreCreditTransactionIndex === -1) {
			const amountToApply = Math.min(storeCreditAmount, totalPrice);
			handlePayment("Store Credit", amountToApply);
			//console.log(`Added store credit transaction with amount: ${amountToApply}`);
		} else {
			// If store credit transaction exists, update it if necessary
			const newAmountToApply = Math.min(storeCreditAmount, totalPrice);
			const existingTransaction =
				transactions[existingStoreCreditTransactionIndex];

			if (existingTransaction.amount !== newAmountToApply) {
				const updatedTransactions = [...transactions];
				updatedTransactions[existingStoreCreditTransactionIndex] = {
					...existingTransaction,
					amount: newAmountToApply,
				};
				setTransactions(updatedTransactions);
				//console.log(`Updated store credit transaction amount to: ${newAmountToApply}`);
			}
		}
	}, [customer, totalPrice, transactions]);

	const handleOrderSubmission = () => {
		// If there are any KDS order items, show the fulfillment modal so that items can be marked as fulfilled.
		if (localKdsItems && localKdsItems.length > 0) {
			setShowFulfillmentModal(true);
		} else {
			// No KDS items; submit immediately.
			createOrder();
		}
	};

	const cancelOrder = async (
		orderId: number,
		refundOrder?: boolean,
		restockOrder?: boolean,
		reason?: string
	) => {
		try {
			await cancelAllFuls();
			setSubmissionMessage("Canceling order...");
			const response = await fetch("/api/cancel-order", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${sessionStorage.getItem("token")}`,
				},
				body: JSON.stringify({
					orderId: "gid://shopify/Order/" + orderId,
					refund: refundOrder,
					restock: restockOrder,
					staffNote: reason,
					email: false,
				}),
			});
			const data = await response.json();
			if (response.ok) {
				//$1('Order canceled successfully:', data);

				setSubmissionMessage("Marking KDS order as fulfilled...");
				// Also mark the KDS order as fulfilled (skip item updates)
				fetch(`/api/kds-orders/${orderId}/mark-fulfilled?skipItemUpdate=true`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${sessionStorage.getItem("token")}`,
					},
				})
					.then((res) => res.json())
					.then((kdsData) => {
						console.log("KDS order status updated to fulfilled:", kdsData);
					})
					.catch((error) => {
						console.log("Error updating KDS order status:", error);
					});

				setSubmissionMessage("Cancelling Attendance...");

				fetch("/api/cancel-attendance", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${sessionStorage.getItem("token")}`,
					},
					body: JSON.stringify({
						order_number: orderNumber,
					}),
				})
					.then((response) => response.json())
					.then((data) => {
						updateOrder();
						// Handle success - e.g., update UI or state
					})
					.catch((error) => {
						updateOrder();
						//$1('failed to cancel attendance:', error);
						setSubmissionMessage(
							"Failed to cancel attendance. Please try again." + error.message
						);
						// Handle error - e.g., show error message to user
					});
				// Find all membership check-in items and cancel their most recent check-ins
				const checkinItems = lineItems.filter((item) =>
					item.title.includes("Check-In")
				);

				if (checkinItems.length > 0) {
					setSubmissionMessage("Canceling membership check-ins...");
					await Promise.all(
						checkinItems.map(async (item) => {
							const membershipNumber = item.properties.find(
								(property) => property.name === "membership_number"
							)?.value;

							if (membershipNumber) {
								try {
									await fetch("/api/delete-recent-checkin", {
										method: "POST",
										headers: {
											"Content-Type": "application/json",
											Authorization: `Bearer ${sessionStorage.getItem(
												"token"
											)}`,
										},
										body: JSON.stringify({
											membership_number: membershipNumber,
										}),
									});
									//$1(`Check-in for membership ${membershipNumber} canceled`);
								} catch (error) {
									console.error(
										`Failed to cancel check-in for membership ${membershipNumber}:`,
										error
									);
								}
							}
						})
					);
				}

				setCurrentTab(1);
				// Handle successful cancellation here (e.g., show a success message)
			} else {
				console.error("Error canceling order:", data);
				setSubmissionMessage(data.message);
				// Handle error here (e.g., show an error message)
			}
		} catch (error) {
			console.error("Error canceling order:", error);
			setSubmissionMessage(error.message);
			// Handle error here (e.g., show an error message)
		}
	};

	const moneyDisplay = (amount: number) => {
		//if (amount === 0) return "";
		return `${amount.toLocaleString("en-US", {
			style: "currency",
			currency: "USD",
		})}`; // Convert number to money for display with commas
	}; //converts number to money for display

	const toggleModal = () => {
		setPayWindow((prev) => !prev);
	}; //toggles payment modal window

	const handleChange = (amount: number) => {
		const newTransactionsArray = [...transactions];
		let newTransaction: Types.Transaction = {};
		newTransaction = {
			amount: amount,
			gateway: "Cash",
			currency: "USD",
			kind: "change",
			status: "success",
			message: "Change",
		};
		newTransactionsArray.push(newTransaction);
		setTransactions(newTransactionsArray);
		setTypedPaymentValue(0);
		setConvertedPaymentValue(0);
		setChangeAmount(amount);
		setShowChangeModal(true);
	}; //creates a change payment

	const handleAcknowledgement = () => {
		// Logic after acknowledging the change
		setShowChangeModal(false);
		setEditingOrderNotes(false);
	};

	const handlePayment = (
		type: string,
		amount: number = convertedValueRef.current
	) => {
		if (type === "Tab") {
			if (amountDue < 0) {
				toast(
					"Cannot create a tab with a negative total. Please cancel the original tab order to delete a tab.",
					{
						type: "error",
					}
				);
				return;
			}
			if (!customer.email) {
				toast(
					"Customer with email is required to create a tab. Please add a customer or employee with a valid email address.",
					{
						type: "error",
					}
				);
				return;
			}
		}
		const newTransactionsArray = [...transactionsRef.current];
		let newTransaction: Types.Transaction = {};
		newTransaction = {
			amount: amount || amountDueRef.current,
			gateway: type,
			currency: "USD",
			kind: "sale",
			status: "success",
		};
		//$1('newTransaction', newTransaction)
		newTransactionsArray.push(newTransaction);
		setTransactions(newTransactionsArray);
		setTypedPaymentValue(0);
		setConvertedPaymentValue(0);
		setTypedValue("");
	}; //creates a payment

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = Number(e.target.value);
		if (!isNaN(value)) {
			setTypedPaymentValue(value);
			setConvertedPaymentValue(value / 100);
			//console.log("value: ", value);
			//console.log("payment value: ", value / 100);
		}
	}; //input handler, also updates display which converts integer to money amounts 2499 => 24.99

	const handleInputKeydown = (e: { key: string; keyCode: number }) => {
		if (e.key === "Enter" || e.keyCode === 13) {
			handlePayment("Cash");
		}
	}; //submit cash payment on Enter press

	const deleteTransaction = (transactionToDelete: Types.Transaction) => {
		const newTransactions = transactions.filter(
			(transaction) => transaction !== transactionToDelete
		);
		setTransactions(newTransactions);
	};

	const [isAddingDiscount, setIsAddingDiscount] = useState(false);

	const toggleAddDiscount = (discount?: Types.DiscountCode) => {
		("toggling edit!");
		if (isAddingDiscount && discount) {
			!discountCodes.find((dc) => dc.code === discount.code)
				? saveDiscount(discount)
				: setIsAddingDiscount(false);
		} else if (isAddingDiscount && !discount) {
			setIsAddingDiscount(false);
			//$1('removing add discount')
		} else {
			setIsAddingDiscount(true);
		}
	};

	const saveDiscount = (discount: Types.DiscountCode) => {
		setDiscountCodes([...discountCodes, discount]);
		setIsAddingDiscount(false);
	};

	const handleKdsToggle = (index: number) => {
		// Map over the local array
		const updatedItems = localKdsItems.map((itm, i) => {
			if (i !== index) return itm;

			const isFulfilled = itm.prepared_quantity > 0;
			return {
				...itm,
				prepared_quantity: isFulfilled ? 0 : itm.quantity,
				fulfilled_quantity: isFulfilled ? 0 : itm.quantity,
			};
		});

		setLocalKdsItems(updatedItems);
	};

	return (
		<div className="paymentButtonsInnerWrapper">
			{!orderId && totalPrice !== 0 && amountDue !== 0 ? (
				<>
					<button className="payBtnHalf" onClick={(e) => toggleAddDiscount()}>
						Add Discount
					</button>
					{mode === "front" ? (
						<button
							className="payBtnHalf"
							onClick={() => handlePayment("Less Deposit")}
						>
							{moneyDisplay(convertedPaymentValue || amountDue)} Less Deposit
						</button>
					) : (
						<button className="payBtnHalf" onClick={() => handlePayment("Tab")}>
							{moneyDisplay(convertedPaymentValue || amountDue)} Tab
						</button>
					)}
					<button className="payBtnHalf" onClick={() => handlePayment("Cash")}>
						{moneyDisplay(convertedPaymentValue || amountDue)} Cash
					</button>
					<button
						className="payBtnHalf"
						onClick={() => handlePayment("Quickbooks Payments")}
					>
						{moneyDisplay(convertedPaymentValue || amountDue)} Card
					</button>
					{Object.keys(customer).length > 0 ? (
						<>
							<button
								className="payBtnHalf"
								onClick={() => handlePayment("Tab")}
							>
								{moneyDisplay(convertedPaymentValue || amountDue)} Tab
							</button>
							<button className="payBtnHalf" onClick={toggleModal}>
								All Payment Options
							</button>
						</>
					) : (
						<button className="payBtn" onClick={toggleModal}>
							All Payment Options
						</button>
					)}
				</>
			) : !orderId && amountDue === 0 ? (
				<>
					<button className="payBtnHalf" onClick={(e) => toggleAddDiscount()}>
						Add Discount
					</button>
					<button className="payBtnHalf" onClick={toggleModal}>
						Payment Options
					</button>
					{lineItems.length > 0 ? (
						<button
							className="payBtnDouble"
							onClick={handleOrderSubmission}
							disabled={isSubmitting}
						>
							Submit Order
						</button>
					) : (
						<button
							className="payBtnDouble"
							onClick={(_e) => clearOrder()}
							disabled={isSubmitting}
						>
							Clear Order
						</button>
					)}
				</>
			) : fulfilled !== "fulfilled" ? (
				<>
					<button
						className="payBtnHalf"
						onClick={() => setEditingOrderNotes(true)}
					>
						{orderNotes ? "Edit Order Notes" : "Add Order Notes"}
					</button>
					<button
						className="payBtnHalf"
						onClick={() => setCancellingOrder(true)}
					>
						Cancel Order
					</button>
					<button className="payBtn" onClick={() => setFulOptions(true)}>
						Fulfillment Options
					</button>
					<button
						className="payBtn"
						onClick={() => fulfillAllOrders(true, false)}
					>
						Fulfill All
					</button>
				</>
			) : (
				<>
					<button
						className="payBtnHalf"
						onClick={() => {
							setEditingOrderNotes(true);
						}}
					>
						{orderNotes ? "Edit Order Notes" : "Add Order Notes"}
					</button>
					<button
						className="payBtnHalf"
						onClick={() => setCancellingOrder(true)}
					>
						Cancel Order
					</button>
					<button
						className="payBtn"
						onClick={() => {
							clearOrder();
						}}
					>
						Clear Order
					</button>
					<button
						className="payBtn"
						onClick={() => {
							if (window.electronAPI && reprintable) {
								window.electronAPI.reprintLastOrder();
							} else {
								fulfillAllOrders(false, true);
							}
						}}
					>
						{window.electronAPI && reprintable
							? "Reprint Receipt"
							: "Print Receipt"}
					</button>
				</>
			)}

			{payWindow && (
				<>
					<div className="paymentModalBackdrop" onClick={toggleModal}></div>
					<div className="paymentModal">
						<table className="receiptTable">
							<tbody>
								<tr>
									<td>Subtotal:</td>
									<td>{moneyDisplay(subtotalPrice)}</td>
								</tr>
								{taxLines.map((line) => (
									<tr key={line.title}>
										<td>
											{line.title} ({line.rate || 0 * 100}%):
										</td>
										<td>{moneyDisplay(line.price || 0)}</td>
									</tr>
								))}
								<tr>
									<td>Total:</td>
									<td>{moneyDisplay(totalPrice)}</td>
								</tr>
								{transactions.map((transaction) => (
									<tr
										key={transaction.gateway}
										className={`transactionRow ${
											transaction.kind == "sale" ? "redPayment" : ""
										}`}
									>
										<td>{transaction.message || transaction.gateway}:</td>
										<td>
											{moneyDisplay(transaction.amount || 0)}
											<button
												className="deleteTransactionButton"
												onClick={() => deleteTransaction(transaction)}
											>
												[x]
											</button>
										</td>
									</tr>
								))}
								<tr style={{ fontWeight: "bold" }}>
									<td>Amount Due:</td>
									<td>{moneyDisplay(amountDue)}</td>
								</tr>
							</tbody>
						</table>
						<br />
						<div className="inputWrapper">
							<span className="displayedValue">
								{moneyDisplay(convertedPaymentValue || amountDue)}
							</span>
							<input
								value={typedPaymentValue}
								ref={paymentRef}
								onChange={handleInputChange}
								onKeyDown={handleInputKeydown}
							/>
						</div>
						<br />
						<button onClick={() => handlePayment("Cash")}>Cash</button>
						<br />
						<button onClick={() => handlePayment("Quickbooks Payments")}>
							Card
						</button>

						{mode === "front" && (
							<React.Fragment>
								<br />
								<button onClick={() => handlePayment("Less Deposit")}>
									Less Deposit
								</button>
								<br />
								<button onClick={() => handlePayment("ACH")}>ACH</button>
							</React.Fragment>
						)}
						<br />
						<button onClick={() => handlePayment("Tab")}>Tab</button>
						{mode === "front" && (
							<React.Fragment>
								<br />
								<hr />
								<br />
								<button
									onClick={() => {
										const name =
											(customer?.first_name || "") +
											(customer?.last_name ? " " + customer.last_name : "");
										const order = {
											pos_order_id: null,
											order_number: null,
											status: null,
											items: kdsOrderItems,
											name: name || null,
										};
										printTicket(order);
										setPayWindow(false);
										clearOrder();
									}}
								>
									Print Order Ticket
								</button>
							</React.Fragment>
						)}
					</div>
				</>
			)}
			{showChangeModal && (
				<>
					<div
						className="paymentModalBackdrop"
						onClick={handleAcknowledgement}
					></div>
					<div className="paymentModal">
						<h2>Change Due</h2>
						<p>
							Please give the customer <h1>{moneyDisplay(changeAmount)}</h1> in
							change.
						</p>
						<button onClick={handleAcknowledgement}>OK</button>
					</div>
				</>
			)}
			{isAddingDiscount && (
				<>
					<div
						className="discountModalBackdrop"
						onClick={(e) => toggleAddDiscount()}
					></div>
					<div key={"discountpanel"} className="editDiscount">
						<b>Add Discount</b>{" "}
						<sup onClick={(e) => toggleAddDiscount()}>[x]</sup>
						<div className="discountInfo" id="discountinfo"></div>
						<button
							onClick={(e) =>
								toggleAddDiscount({
									code: "PREMIUM",
									amount: 20,
									type: "percentage",
								})
							}
						>
							Premium Discount
						</button>
						{mode === "front" && (
							<React.Fragment>
								<br />
								<label htmlFor="custom-discount-amount">
									Custom $ Discount
								</label>
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
								<label htmlFor="custom-discount-percent">
									Custom % Discount
								</label>
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
							</React.Fragment>
						)}
						<br />
					</div>
				</>
			)}
			{editingOrderNotes && (
				<>
					<div
						className="paymentModalBackdrop"
						onClick={() => {
							addNotesToOrder();
							setEditingOrderNotes(false);
						}}
					></div>
					<div className="paymentModal">
						<div className="modal-content">
							<h2>Order Notes</h2>
							<input
								value={orderNotes}
								className="orderNotes"
								type="textarea"
								onChange={(e) => setOrderNotes(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault(); // Prevent default behavior (like form submission)
										addNotesToOrder();
										setEditingOrderNotes(false);
									}
								}}
							/>
							<button
								onClick={() => {
									addNotesToOrder();
									setEditingOrderNotes(false);
								}}
							>
								OK
							</button>
						</div>
					</div>
				</>
			)}
			{cancellingOrder && (
				<>
					<div
						className="paymentModalBackdrop"
						onClick={() => setCancellingOrder(false)}
					></div>
					<div className="paymentModal">
						<div className="cancel-modal-content">
							<h2>Cancel Order</h2>
							<label htmlFor="cancel-bool">Refund Order?</label>
							<input
								id="cancel-bool"
								type="checkbox"
								checked={refundOrder}
								onChange={(e) => setRefundOrder(e.target.checked)}
							/>
							<label htmlFor="restock-bool">Restock Order?</label>
							<input
								id="restock-bool"
								type="checkbox"
								checked={restockOrder}
								onChange={(e) => setRestockOrder(e.target.checked)}
							/>
							<label htmlFor="cancel-reason">Reason:</label>
							<input
								id="cancel-reason"
								type="text"
								value={cancelReason}
								onChange={(e) => setCancelReason(e.target.value)}
							/>
							<br />
							<br />
							<button
								onClick={() => {
									cancelOrder(orderId, refundOrder, restockOrder, cancelReason);
									setCancellingOrder(false);
								}}
							>
								Cancel Order
							</button>
						</div>
					</div>
				</>
			)}
			{fulOptions && (
				<>
					<div
						className="paymentModalBackdrop"
						onClick={() => setFulOptions(false)}
					></div>
					<div className="fulOptionsModal">
						<div className="modal-content">
							<h2>Fulfill Order Options</h2>
							{fulOrders
								.filter((ful) =>
									ful.supported_actions.includes("create_fulfillment")
								)
								.map((order) => (
									<div key={order.id}>
										{order.line_items
											.filter((item) => item.fulfillable_quantity > 0)
											.map((item) => (
												<div key={item.id}>
													<label>
														<b>
															{
																lineItems.find(
																	(i) => i.id === item.line_item_id
																)?.title
															}
														</b>
														<br />
														<i>
															{
																lineItems.find(
																	(i) => i.id === item.line_item_id
																)?.variant_title
															}
														</i>
														{lineItems.find((i) => i.id === item.line_item_id)
															?.variant_title ? (
															<br />
														) : (
															<></>
														)}
														<input
															type="number"
															min="0"
															max={item.fulfillable_quantity}
															defaultValue={item.fulfillable_quantity}
															onChange={(e) => {
																const quantity = parseInt(e.target.value, 10);
																setFulfilledQuantities((prev) => ({
																	...prev,
																	[item.id]: quantity,
																}));
															}}
														/>{" "}
														/ {item.fulfillable_quantity} available
													</label>
												</div>
											))}
									</div>
								))}
							<label>
								<input
									type="checkbox"
									defaultChecked={notifyCustomer}
									onChange={(e) => setNotifyCustomer(e.target.checked)}
								/>
								Send Email Notification
							</label>
							<label>
								<input
									type="checkbox"
									defaultChecked={printReceipt}
									onChange={(e) => setPrintReceipt(e.target.checked)}
								/>
								Print Receipt
							</label>
							<br />
							<br />
							<button
								onClick={() => {
									const fulfillData = fulOrders
										.filter((ful) =>
											ful.supported_actions.includes("create_fulfillment")
										)
										.map((order) => ({
											fulfillmentOrderId: `gid://shopify/FulfillmentOrder/${order.id}`,
											fulfillmentOrderLineItems: order.line_items
												.filter(
													(item) =>
														fulfilledQuantities[item.id] > 0 ||
														fulfilledQuantities[item.id] === undefined
												)
												.map((item) => ({
													id: `gid://shopify/FulfillmentOrderLineItem/${item.id}`,
													quantity:
														fulfilledQuantities[item.id] ||
														item.fulfillable_quantity,
												})),
										}));
									fulfillWithOptions(fulfillData, notifyCustomer, printReceipt);
									setFulOptions(false);
								}}
							>
								Fulfill Selected
							</button>
						</div>
					</div>
				</>
			)}
			{showFulfillmentModal && (
				<>
					{/* Backdrop */}
					<div
						className="paymentModalBackdrop"
						onClick={() => setShowFulfillmentModal(false)}
					></div>
					{/* Split Modal Container */}
					<div
						className={`paymentModal fulfillmentModal ${
							mode === "front" ? "splitModal" : ""
						}`}
					>
						{/* Left Column: Send to KDS controls */}
						<div className="modalColumn leftColumn">
							<h2>Send to KDS</h2>
							<i>Check any items fulfilled at the register</i>
							<div className="fulfillmentItems">
								{localKdsItems.map((item, index) => (
									<div key={index}>
										<label
											onClick={() => handleKdsToggle(index)}
											onTouchEnd={() => handleKdsToggle(index)}
											style={{
												display: "flex",
												alignItems: "center",
												cursor: "pointer",
											}}
										>
											<input
												type="checkbox"
												checked={item.prepared_quantity > 0}
												readOnly
											/>
											{item.item_name}{" "}
											{item.quantity ? `x ${item.quantity}` : ""}
										</label>
									</div>
								))}
							</div>
							<br />
							<button
								onClick={() => {
									setShowFulfillmentModal(false);
									createOrder(localKdsItems);
								}}
							>
								Send Order to KDS
							</button>
						</div>
						{/* Right Column: Alternative actions */}
						{mode === "front" && (
							<div className="modalColumn rightColumn">
								<h2>Do Not Send to KDS</h2>
								<button
									onClick={() => {
										const updatedItems: Types.KDSOrderItem[] =
											localKdsItems.map((item) => ({
												...item,
												prepared_quantity: item.quantity,
												fulfilled_quantity: item.quantity,
											}));
										const name =
											(customer?.first_name || "") +
											(customer?.last_name ? " " + customer.last_name : "");

										const kdsOrder: Types.KDSOrder = {
											pos_order_id: null,
											order_number: null,
											status: null,
											items: updatedItems,
											name: name || null,
										};

										setShowFulfillmentModal(false);
										printTicket(kdsOrder);
										createOrder(updatedItems);
									}}
								>
									Print Order Ticket
								</button>
								<br />
								<button
									onClick={() => {
										const updatedItems: Types.KDSOrderItem[] =
											localKdsItems.map((item) => ({
												...item,
												prepared_quantity: item.quantity,
												fulfilled_quantity: item.quantity,
											}));
										setShowFulfillmentModal(false);
										createOrder(updatedItems);
									}}
								>
									Submit Order Only
									<br />
									<i style={{ fontSize: "0.8em" }}>(No KDS / No Ticket)</i>
								</button>
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}
