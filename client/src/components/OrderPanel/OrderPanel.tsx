import React, { useState, useEffect } from "react";
import "./OrderPanel.scss";
import * as Types from "../POSWindow/POSTypes";
import { usePOS } from "../../contexts/POSContext";

export default function OrderPanel() {
	const {
		thisOrderItems,
		setThisOrderItems,
		orderNumber,
		subtotalPrice,
		totalPrice,
		transactions,
		orderId,
		clearOrder,
		undoFul,
		fulfilled,
		refunds,
		setTriggerReset,
		triggerReset,
		discountCodes,
		setDiscountCodes,
		orderNotes,
		lineItems,
		shopifyDiscountCodes,
		totalTaxAmount,
		fulfillments,
		soundManager,
		isOrderCancelled,
		mode,
	} = usePOS();

	useEffect(() => {
		const myDiv = document.getElementById("itemsfororder");
		if (myDiv) {
			myDiv.scrollTop = myDiv.scrollHeight;
		}
	});

	const [editAttrIndex, setEditAttrIndex] = useState(-1);
	const [editAttrSubIndex, setEditAttrSubIndex] = useState(-1);
	const [newAttrName, setNewAttrName] = useState("");
	const [newAttrValue, setNewAttrValue] = useState("");
	const [editingDiscountCodes, setEditingDiscountCodes] = useState(false);

	const [contextMenu, setContextMenu] = useState({
		isVisible: false,
		x: 0,
		y: 0,
		index: -1,
	});

	useEffect(() => {
		setContextMenu({
			isVisible: false,
			x: 0,
			y: 0,
			index: -1,
		});
		setEditAttrIndex(-1);
		setEditAttrSubIndex(-1);
		setNewAttrName("");
		setNewAttrValue("");
	}, [triggerReset]);

	const handleRightClick = (event, index) => {
		//$1("right click:", index);
		event.preventDefault(); // Prevent the default context menu
		setContextMenu({
			isVisible: true,
			x: event.clientX,
			y: event.clientY,
			index,
		});
	};

	const toggleTaxable = () => {
		const newItems = [...thisOrderItems];
		const item = newItems[contextMenu.index];
		item.taxable = !item.taxable;
		setThisOrderItems(newItems);
		setContextMenu({ ...contextMenu, isVisible: false });
	};

	function toTwoDecimalPlaces(num) {
		return Math.round(num * 100) / 100;
	}

	function printTotal() {
		const priceArray: React.JSX.Element[] = [];
		let transTotal = 0;
		//let totalDiscountValue = 0;

		shopifyDiscountCodes.forEach((discount, index) => {
			let discountValue = 0;
			if (discount.type === "percentage") {
				discountValue = toTwoDecimalPlaces(
					(discount.amount * subtotalPrice) / 100
				);
			} else {
				discountValue = discount.amount;
			}

			priceArray.push(
				<b key={"discdesc-code-" + index} className={`listItem`}>
					{discount.title || discount.code || "Discount"}
				</b>
			);
			priceArray.push(
				<b key={"discamt-code-" + index} className={`listItemPrice`}>
					-{formatCurrency(discountValue) + "\n"}
				</b>
			);
			//totalDiscountValue += discountValue;
		});

		/*
    shopifyDiscountCodes.forEach((discount, index) => {
      const discountValue = toTwoDecimalPlaces(discount.amount);
      priceArray.push(
          <b key={"discdesc-code-" + index} className={`listItem`}>
              {discount.title || discount.code || "Discount"}
          </b>
      );
      priceArray.push(
          <b key={"discamt-code-" + index} className={`listItemPrice`}>
              -{formatCurrency(discountValue) + "\n"}
          </b>
      );
      //totalDiscountValue += discountValue;
    });
    */

		priceArray.push(
			<b key={"sbtl"} className="listItem">
				SUBTOTAL
			</b>
		);
		priceArray.push(
			<b key={"sbtlamt"} className="listItemPrice">
				{formatCurrency(subtotalPrice) + "\n"}
			</b>
		);

		if (totalTaxAmount === 0) {
			priceArray.push(
				<b key={"taxdesc0"} className="listItem">
					SALES TAX
				</b>
			);
			priceArray.push(
				<b key={"taxamt0"} className="listItemPrice">
					{formatCurrency(0) + "\n"}
				</b>
			);
		} else {
			priceArray.push(
				<b key={"taxdesc"} className="listItem">
					SALES TAX (8.25%)
				</b>
			);
			priceArray.push(
				<b key={"taxamt"} className="listItemPrice">
					{formatCurrency(totalTaxAmount) + "\n"}
				</b>
			);
		}
		priceArray.push(
			<b key={"totaldesc"} className="listItem">
				TOTAL
			</b>
		);
		priceArray.push(
			<b key={"totalamt"} className="listItemPrice">
				{formatCurrency(totalPrice) + "\n"}
			</b>
		);

		transactions?.forEach((transaction, index) => {
			priceArray.push(
				<b
					key={"transdesc-" + index}
					className={`listItem ${
						transaction.kind === "sale" ? "redPayment" : ""
					}`}
				>
					{transaction.kind === "change" ? `Change` : transaction.gateway}
				</b>
			);
			priceArray.push(
				<b
					key={"transamt-" + index}
					className={`listItemPrice ${
						transaction.kind === "sale" ? "redPayment" : ""
					}`}
				>
					{/* if refund or change, use () around amount */}
					{transaction.kind === "refund" || transaction.kind === "change"
						? `(${formatCurrency(transaction.amount)})`
						: formatCurrency(transaction.amount)}
				</b>
			);
			if (transaction.kind === "sale") transTotal += transaction.amount;
			else if (transaction.kind === "refund") transTotal -= transaction.amount;
			else if (transaction.kind === "change") transTotal -= transaction.amount;
		});

		if (transTotal > 0) {
			priceArray.push(
				<b key={"duedesc"} className="listItem">
					Amount Due
				</b>
			);
			priceArray.push(
				<b key={"dueamt"} className="listItemPrice">
					{formatCurrency(totalPrice - transTotal) + "\n"}
				</b>
			);
		}
		return priceArray;
	}

	function formatCurrency(amount: number) {
		return amount.toLocaleString("en-US", {
			style: "currency",
			currency: "USD",
		});
	} //

	function clearItemX(e) {
		const clearnum = e.target.id.split("-")[1];
		const newOrder = [...thisOrderItems];
		newOrder.splice(clearnum, 1);
		setThisOrderItems([...newOrder]);
		//$1("item cleared!");
		soundManager.play("pop8");
		setTriggerReset(triggerReset + 1);
	}
	function clearAttribute(e) {
		const itemIndex = parseInt(e.target.id.split("-")[1]);
		const attrIndex = parseInt(e.target.id.split("-")[2]);
		const newOrder = [...thisOrderItems];
		if (newOrder[itemIndex]?.properties?.[attrIndex]) {
			newOrder[itemIndex].properties?.splice(attrIndex, 1);
			setThisOrderItems(newOrder);
		} else if (lineItems[itemIndex]?.properties?.[attrIndex]) {
			if (lineItems[itemIndex].properties?.[attrIndex].name === "Discount") {
				console.log("else");
			}
		}
		//$1("Attribute cleared!");
		soundManager.play("pop9");
	}

	/*
  function addNewAttribute(index: number) {
    // Create a deep copy of the item you wish to modify
    const itemCopy: Types.ExtendedLineItem = JSON.parse(
      JSON.stringify(thisOrderItems[index])
    );

    // Check if the item already has properties, if not, initialize it
    if (!itemCopy.properties) {
      itemCopy.properties = [];
    }
    // Add an attribute with default values
    itemCopy.properties.push({
      name: "Custom Attribute",
      value: "Default Value",
    });

    // Create a shallow copy of the order array
    const newOrder = [...thisOrderItems];
    // Replace the item at the specified index with the modified item copy
    newOrder[index] = itemCopy;

    // Update the order state
    setThisOrderItems(newOrder);
    // Set the newly added attribute to be edited
    setEditAttrIndex(index);
    setEditAttrSubIndex(itemCopy.properties?.length - 1);
  }*/

	function handleItemClick(i: number) {
		//move item to the bottom of the list
		const newOrder = [...thisOrderItems];
		newOrder.push(newOrder[i]);
		newOrder.splice(i, 1);
		setThisOrderItems(newOrder);
		setTriggerReset(triggerReset + 1);
	}

	function handleModClick(itemIndex: number, attrIndex: number) {
		//move the item to the bottom of the list, and move the attr to the bottom of the item
		const newOrder = [...thisOrderItems];
		const item = newOrder[itemIndex];
		const attr = item.properties?.[attrIndex];
		newOrder.push(item);
		newOrder.splice(itemIndex, 1);
		item.properties?.push(attr);
		item.properties?.splice(attrIndex, 1);
		setThisOrderItems(newOrder);
		setTriggerReset(triggerReset + 1);
	}

	function handleItemEditName(event) {
		setNewAttrName(event.target.value);
	}

	function handleItemEditValue(event) {
		setNewAttrValue(event.target.value);
	}

	function handleItemSave() {
		if (editAttrIndex !== -1) {
			const newOrder = [...thisOrderItems];
			if (newAttrValue === "") {
				// Remove the attribute if the Name or value is empty
				newOrder[editAttrIndex].properties?.splice(editAttrSubIndex, 1);
			} else {
				const newAttribute = {
					name: newAttrName || "Custom",
					value: newAttrValue,
				};
				setNewAttrName("");
				setNewAttrValue("");
				if (editAttrSubIndex === -1) {
					if (newOrder[editAttrIndex].properties) {
						newOrder[editAttrIndex].properties?.push(newAttribute);
					} else {
						newOrder[editAttrIndex].properties = [newAttribute];
					}
				} else {
					if (newOrder[editAttrIndex].properties) {
						const properties = newOrder[editAttrIndex].properties;
						if (properties?.[editAttrSubIndex]) {
							properties[editAttrSubIndex] = newAttribute;
						}
					}
				}
			}
			setThisOrderItems(newOrder);
			setEditAttrIndex(-1);
			setEditAttrSubIndex(-1);
		}
	}

	/*
  function isLineItemCanceled(itemId, refunds) {
    for (const refund of refunds) {
      if (refund.refund_line_items) {
        for (const refundLineItem of refund.refund_line_items) {
          if (refundLineItem.line_item_id === itemId) {
            return true;
          }
        }
      }
    }
    return false;
  }
  */

	function printOrder(items: Types.ExtendedLineItem[]) {
		const orderArray = [];

		const openPopupWindow = (url, windowName, windowFeatures) => {
			window.open(url, windowName, windowFeatures);
			//$1("opening window!");
		};

		orderArray.push(
			<b
				key={"ordernum" + orderNumber}
				className={"listItem" + (isOrderCancelled ? " cancelled" : "")}
			>
				{orderId ? (
					<span>
						Order#:{" "}
						<span
							onClick={() =>
								openPopupWindow(
									`https://admin.shopify.com/store/zdts-amusement-park/orders/${orderId}`,
									"newWindow",
									"width=800,height=600"
								)
							}
						>
							{orderNumber}
						</span>
					</span>
				) : (
					`Order ${orderNumber ? `#${orderNumber}` : ""}`
				)}
				{!orderId && items?.length > 0 ? (
					<sup onClick={() => clearOrder(false, false)}>[x]</sup>
				) : (
					<sup onClick={() => clearOrder()}>[x]</sup>
				)}
			</b>
		); //order number header
		orderArray.push(<p key="ordernum-right" className="listItemPrice"></p>);
		if (items.length === 0) {
			return orderArray;
		}

		for (let i = 0; i < items?.length; i++) {
			const fulfillmentStatus = fulfillments.find(
				(fulfillment) =>
					fulfillment.line_items.some((item) => item.id === items[i].id) &&
					fulfillment.status === "success"
			)?.status;

			// Calculate total refunded quantity for this line_item
			let refundedQty = 0;
			for (const refund of refunds) {
				if (refund.refund_line_items) {
					for (const refundLineItem of refund.refund_line_items) {
						if (refundLineItem.line_item_id === items[i].id) {
							refundedQty += refundLineItem.quantity;
						}
					}
				}
			}

			// Consider the item canceled only if the total refunded quantity >= original quantity
			const isCanceled =
				fulfillmentStatus === "cancelled" ||
				refundedQty >= (items[i].quantity || 0);
			console.log("isCanceled", isCanceled, items[i]);
			let fulfilled_quantity = 0;
			fulfilled_quantity =
				(items[i].quantity || 0) - items[i].fulfillable_quantity - refundedQty;

			if (orderId) {
				if (isCanceled) {
					orderArray.push(
						<p
							key={"orderline-cancelled-" + i}
							className={`listItem cancelled fulfilled`}
						>
							{items[i].quantity} x {items[i].title}
							{items[i].fullPrice > 0 || items[i].price > 0 ? (
								<>@ {formatCurrency(items[i].fullPrice || items[i].price)} </>
							) : (
								""
							)}
							{" (cancelled)"}
						</p>
					);
					orderArray.push(
						<p
							key={"lineprice-cancelled-" + i}
							className="listItemPrice cancelled fulfilled"
						>
							{formatCurrency(items[i].quantity * items[i].price) + "\n"}
						</p>
					);
				} else {
					if (items[i].fulfillable_quantity) {
						orderArray.push(
							<p key={"orderline-" + i} className={`listItem`}>
								{items[i].fulfillable_quantity} x {items[i].title}
								{items[i].fullPrice > 0 || items[i].price > 0 ? (
									<>@ {formatCurrency(items[i].fullPrice || items[i].price)} </>
								) : (
									""
								)}
							</p>
						);
						orderArray.push(
							<p key={"lineprice-" + i} className="listItemPrice">
								{formatCurrency(items[i].quantity * items[i].price) + "\n"}
							</p>
						);
					}

					if (fulfilled_quantity) {
						orderArray.push(
							<p
								key={"orderlinef-" + i}
								className={`listItem ${mode === "front" ? "fulfilled" : ""}`}
							>
								{fulfilled_quantity} x {items[i].title}
								{items[i].fullPrice > 0 || items[i].price > 0 ? (
									<>@ {formatCurrency(items[i].fullPrice || items[i].price)} </>
								) : (
									""
								)}
								{mode === "front" && " (fulfilled)"}
								{mode === "front" && (
									<sup
										onClick={() => {
											undoFul(items[i].id);
										}}
									>
										[Unfulfill]
									</sup>
								)}
							</p>
						);
						orderArray.push(
							<p key={"linepricef-" + i} className="listItemPrice fulfilled">
								{items[i].fulfillable_quantity == 0
									? formatCurrency(items[i].quantity * items[i].price)
									: "" + "\n"}
							</p>
						);
					}
					if (refundedQty) {
						orderArray.push(
							<p
								key={"orderlinef-" + i}
								className={`listItem ${mode === "front" ? "refunded" : ""}`}
							>
								{refundedQty} x {items[i].title}
								{items[i].fullPrice > 0 || items[i].price > 0 ? (
									<>@ {formatCurrency(items[i].fullPrice || items[i].price)} </>
								) : (
									""
								)}
								{mode === "front" && " (refunded)"}
							</p>
						);
						orderArray.push(
							<p key={"linepriceref-" + i} className="listItemPrice refunded">
								{items[i].fulfillable_quantity == 0
									? formatCurrency(items[i].quantity * items[i].price)
									: "" + "\n"}
							</p>
						);
					}
				}
			} else {
				// For new orders that do not have an orderId yet
				orderArray.push(
					//order line item
					<p
						key={"orderline-" + i}
						className={`listItem`}
						onClick={() => handleItemClick(i)}
						onContextMenu={(e) => handleRightClick(e, i)}
					>
						{items[i].quantity < 0 ? "RETURN: " : ""}
						{Math.abs(items[i].quantity)} x {items[i].title}{" "}
						{items[i].fullPrice != null || items[i].price != null ? (
							<>@ {formatCurrency(items[i].fullPrice ?? items[i].price)} </>
						) : (
							""
						)}
						{!items[i].taxable ? "(NT)" : ""}
						{!orderId && (
							<sup
								id={"item-" + i}
								onClick={(e) => {
									e.stopPropagation(); // Prevents the click from reaching <p>
									clearItemX(e);
								}}
							>
								[x]
							</sup>
						)}
					</p>
				);
				orderArray.push(
					//line price
					<p
						key={"lineprice-" + i}
						className="listItemPrice"
						onContextMenu={(e) => handleRightClick(e, i)}
					>
						{formatCurrency(
							items[i].quantity *
								Number(Number(items[i].fullPrice ?? items[i].price).toFixed(2))
						) + "\n"}
					</p>
				);
			}
			if (items[i].properties?.length) {
				//
				const props = items[i].properties.map((att, index) => {
					if (!att.value || att.name.startsWith("_")) {
						return;
					}
					//$1('fulfilled_quantity', fulfilled_quantity)
					return (
						<React.Fragment key={`mod-${i}-${index}`}>
							<p
								key={"modline-" + i + "-" + index}
								className={`listItem modifier 
                  ${items[i].refundedQuantity >= 0 ? "refunded" : ""}
                  ${fulfilled_quantity > 0 ? "fulfilled" : ""}
                  ${isCanceled ? "cancelled" : ""}`}
								onClick={() => handleModClick(i, index)}
							>
								{i === editAttrIndex && index === editAttrSubIndex ? (
									<div className="input-group listItem modifier">
										{newAttrName && (
											<input
												className="attribute-input-key"
												type="text"
												value={newAttrName}
												maxLength={255}
												onChange={handleItemEditName}
												placeholder="key"
												autoFocus
											/>
										)}
										<input
											className="attribute-input-value"
											type="text"
											value={newAttrValue}
											maxLength={255}
											onChange={handleItemEditValue}
											placeholder="value"
										/>
										<button className="save-button" onClick={handleItemSave}>
											Save
										</button>
									</div>
								) : (
									<>
										{att.name != "Custom" && att.name != "Mod"
											? att.name + ": " + att.value
											: att.value}
										{!orderId && att.name !== "discount" && (
											<sup
												id={"attr-" + i + "-" + index}
												onClick={clearAttribute}
											>
												[x]
											</sup>
										)}
										{!orderId && att.name === "discount" && (
											<sup
												id={"attr-" + i + "-" + index}
												onClick={() => setEditingDiscountCodes(true)}
											>
												[edit]
											</sup>
										)}
									</>
								)}
							</p>

							<p key={"modprice-" + i + "-" + index} className="listItemPrice">
								{att.addPrice &&
									Number(att.addPrice) !== 0 &&
									formatCurrency(Number(att.addPrice) * items[i].quantity) +
										"\n"}
							</p>
						</React.Fragment>
					);
				});
				props.forEach((prop) => orderArray.push(prop));
			}
			if (items[i].variant_title) {
				orderArray.push(
					<>
						<p
							key={"variant-" + i}
							className={`listItem modifier 
              ${items[i].refundedQuantity >= 0 ? "refunded" : ""}
              ${!items[i].fulfillable_quantity ? "fulfilled" : ""}
              ${isCanceled ? "cancelled" : ""}`}
						>
							<>{items[i].variant_title}</>
						</p>

						<p key={"variantprice-" + i} className="listItemPrice"></p>
					</>
				);
			}
		} //add each item

		//add order notes if they exist
		orderNotes &&
			orderArray.push(
				<p key={"ordernotes"} className="notes">
					Order Notes: {orderNotes}
				</p>
			);

		return orderArray;
	}

	const handleDiscountCodeChange = (
		index: number,
		field: string,
		value: string | number
	) => {
		const updatedCodes = [...discountCodes];
		updatedCodes[index] = { ...updatedCodes[index], [field]: value };
		setDiscountCodes(updatedCodes);
	};

	const handleCategoryChange = (
		discountIndex: number,
		categoryIndex: number,
		field: string,
		value: string | number
	) => {
		const updatedCodes = [...discountCodes];
		updatedCodes[discountIndex].categories[categoryIndex] = {
			...updatedCodes[discountIndex].categories[categoryIndex],
			[field]: value,
		};
		setDiscountCodes(updatedCodes);
	};

	return (
		<div
			key={`panel-${orderId}`}
			className={
				fulfilled === "fulfilled"
					? "orderGridWrapper fulfilled"
					: "orderGridWrapper"
			}
		>
			<div className="orderGrid" id="itemsfororder">
				{printOrder(lineItems)}
			</div>
			<ContextMenu
				x={contextMenu.x}
				y={contextMenu.y}
				isVisible={contextMenu.isVisible}
				isTaxable={thisOrderItems[contextMenu.index]?.taxable}
				onToggleTax={toggleTaxable}
			/>
			<div className="totalGrid">{printTotal()}</div>
			{editingDiscountCodes && (
				<div
					className="modal-overlay"
					onClick={() => setEditingDiscountCodes(false)}
				>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<h2>Edit Discount Codes</h2>
						{discountCodes.map((discount, index) => (
							<div
								key={`discount-${discount.code}-${index}`}
								className="discount-code"
							>
								<label>
									Code:
									<input
										type="text"
										value={discount.code}
										onChange={(e) =>
											handleDiscountCodeChange(index, "code", e.target.value)
										}
									/>
								</label>
								<label>
									Amount:
									<input
										type="number"
										value={discount.amount}
										onChange={(e) =>
											handleDiscountCodeChange(
												index,
												"amount",
												parseFloat(e.target.value)
											)
										}
									/>
								</label>
								{discount.categories &&
									discount.categories.map((category, catIndex) => (
										<div
											key={`cat-${discount.code}-${category.category}-${catIndex}`}
											className="category"
										>
											<hr />
											<label>
												{category.category} discount:
												<input
													type="number"
													value={category.discount}
													onChange={(e) =>
														handleCategoryChange(
															index,
															catIndex,
															"discount",
															parseFloat(e.target.value)
														)
													}
												/>
											</label>
											{category.max_quantity !== undefined && (
												<label>
													Max Quantity:
													<input
														type="number"
														value={category.max_quantity}
														onChange={(e) =>
															handleCategoryChange(
																index,
																catIndex,
																"max_quantity",
																parseInt(e.target.value, 10)
															)
														}
													/>
												</label>
											)}
										</div>
									))}
							</div>
						))}
						<button onClick={() => setEditingDiscountCodes(false)}>
							Close
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function ContextMenu({ x, y, isVisible, isTaxable, onToggleTax }) {
	const menuRef = React.useRef(null);

	// Use effect to adjust the position if the menu goes off-screen
	React.useEffect(() => {
		if (!menuRef.current || !isVisible) return;

		const menuRect = menuRef.current.getBoundingClientRect();
		const maxX = window.innerWidth - menuRect.width;
		const maxY = window.innerHeight - menuRect.height;

		// Adjust the position of the context menu if it goes off the right or bottom edge of the screen
		if (x > maxX) {
			x = maxX;
		}
		if (y > maxY) {
			y = maxY;
		}

		menuRef.current.style.left = `${x}px`;
		menuRef.current.style.top = `${y}px`;
	}, [x, y, isVisible]);

	if (!isVisible) return null;

	return (
		<div
			ref={menuRef}
			className="context-menu"
			style={{ position: "absolute" }}
		>
			<ul className="context-menu-list">
				<li className="context-menu-item" onClick={onToggleTax}>
					{isTaxable ? "✓ Taxable" : "Taxable"}
				</li>
			</ul>
		</div>
	);
}
