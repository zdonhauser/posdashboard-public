import React, {
	useEffect,
	useState,
	useRef,
	useMemo,
	useCallback,
	useLayoutEffect,
} from "react";
import "./KDS.scss";
import { io } from "socket.io-client";
import KdsOrderBlock from "./KdsOrderBlock";
import { toast } from "react-toastify";

export interface KDSItem {
	id: number;
	kitchen_order_id: number;
	item_name: string;
	quantity: number;
	prepared_quantity: number;
	station: string;
	special_instructions: string | null;
	fulfilled_quantity: number;
	status: string; // Added to track item status
	order_id: number;
}

export interface KDSOrder {
	i: number;
	id: number;
	name?: string | null;
	pos_order_id: number; // e.g. the original POS order ID
	order_number: number; // human-readable order number
	status: string; // 'pending', 'in_progress', 'ready', 'fulfilled'
	front_released: boolean;
	is_fulfilled: boolean;
	items: KDSItem[];
	created_at: string;
	updated_at: string;
	continued?: boolean;
	isFirst?: boolean;
	isLast?: boolean;
}

interface KDSProps {
	mode: "kitchen" | "pickup" | "front" | "recall";
}

const KDS: React.FC<KDSProps> = ({ mode = "kitchen" }) => {
	const [orders, setOrders] = useState<KDSOrder[]>([]);
	const [availableHeight, setAvailableHeight] = useState<number>(0);
	const processingCountRef = useRef(0); // Tracks how many order actions are in progress
	const pendingUpdateRef = useRef(false); // Marks if a socket update came in while processing

	// Ref to hold a debounce timeout for fetching orders
	const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

	// Debounced function to fetch orders after optimistic updates settle
	const scheduleFetchOrders = useCallback(() => {
		// Clear any existing timeout so that we only run once after a burst of actions
		if (refreshTimeout.current) {
			clearTimeout(refreshTimeout.current);
		}
		refreshTimeout.current = setTimeout(() => {
			fetchKDSOrders();
			pendingUpdateRef.current = false;
			refreshTimeout.current = null;
		}, 200); // Adjust delay as needed for smoother updates
	}, []);

	const fetchKDSOrders = useCallback(async () => {
		let orders: KDSOrder[] = [];

		processingCountRef.current += 1;

		const processOrders = () => {
			processingCountRef.current -= 1;
			if (processingCountRef.current === 0) {
				setOrders(orders);
				if (pendingUpdateRef.current) {
					scheduleFetchOrders();
				}
			} else {
				pendingUpdateRef.current = true;
			}
		};

		const fetchOrders = async () => {
			try {
				const response = await fetch(`/api/kds-orders?status=pending`, {
					headers: {
						"Content-Type": "application/json; charset=UTF-8",
						Authorization: `Bearer ${sessionStorage.getItem("token")}`,
					},
				});
				const kitchenOrders = await response.json();
				orders = kitchenOrders;
			} catch (err: any) {
				toast.error("Failed to fetch kitchen orders." + err.message);
			} finally {
				processOrders();
			}
		};

		const fetchPickupOrders = async () => {
			try {
				const response = await fetch(
					`/api/kds-orders?status=ready&status2=pending`,
					{
						headers: {
							"Content-Type": "application/json; charset=UTF-8",
							Authorization: `Bearer ${sessionStorage.getItem("token")}`,
						},
					}
				);
				const pickupOrders = await response.json();
				orders = pickupOrders;
			} catch (err: any) {
				toast.error(err.message + "Failed to fetch pickup orders.");
			} finally {
				processOrders();
			}
		};

		const fetchFulfilledOrders = async () => {
			try {
				const response = await fetch(
					`/api/kds-orders?status=all&order_by=updated_at`,
					{
						headers: {
							"Content-Type": "application/json; charset=UTF-8",
							Authorization: `Bearer ${sessionStorage.getItem("token")}`,
						},
					}
				);
				const fulfilledOrders = await response.json();
				orders = fulfilledOrders; // assign locally
			} catch (err: any) {
				toast.error(err.message + "Failed to fetch fulfilled orders.");
			} finally {
				processOrders(); // ✓ decrement + setOrders
			}
		};

		if (mode === "pickup") {
			await fetchPickupOrders();
		} else if (mode === "recall") {
			await fetchFulfilledOrders();
		} else {
			await fetchOrders();
		}
	}, [mode, scheduleFetchOrders]);

	const handleItemToggle = useCallback(
		async (itemId: number, status: string, orderId: number) => {
			const orderIndex = orders.findIndex((order) => order.id === orderId);
			if (orderIndex === -1) {
				toast.error(
					`Order with id ${orderId} not found, cant update item status to ${status}`
				);
				return;
			}
			processingCountRef.current += 1;

			const updatedOrders = [...orders];
			const targetOrder: KDSOrder = { ...orders[orderIndex] };

			targetOrder.items = targetOrder.items.map((item) =>
				item.id === itemId
					? {
							...item,
							prepared_quantity:
								status === "ready" || status === "fulfilled"
									? item.quantity
									: 0,
							fulfilled_quantity: status === "fulfilled" ? item.quantity : 0,
					  }
					: item
			);

			updatedOrders[orderIndex] = targetOrder;
			setOrders(updatedOrders);

			try {
				const endpoint =
					status === "fulfilled"
						? "mark-fulfilled"
						: status === "ready"
						? "mark-prepared"
						: "unmark";

				await fetch(`/api/kds-items/${itemId}/${endpoint}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json; charset=UTF-8",
						Authorization: `Bearer ${sessionStorage.getItem("token")}`,
					},
				});

				if (targetOrder.status === "ready") {
					if (
						targetOrder.items.some(
							(item) => item.prepared_quantity !== item.quantity
						)
					) {
						handleOrderStatus(orderId, "pending", true, targetOrder);
					}
					if (
						targetOrder.items.every(
							(item) => item.fulfilled_quantity === item.quantity
						)
					) {
						handleOrderStatus(orderId, "fulfilled", true, targetOrder);
					}
				} else if (targetOrder.status === "pending") {
					if (
						targetOrder.items.every(
							(item) => item.prepared_quantity === item.quantity
						)
					) {
						handleOrderStatus(orderId, "ready", true, targetOrder);
					}
				} else if (targetOrder.status === "fulfilled") {
					if (
						targetOrder.items.some(
							(item) => item.prepared_quantity !== item.quantity
						)
					) {
						handleOrderStatus(orderId, "pending", true, targetOrder);
					} else if (
						targetOrder.items.some(
							(item) => item.fulfilled_quantity !== item.quantity
						)
					) {
						handleOrderStatus(orderId, "ready", true, targetOrder);
					}
				}
			} catch (error) {
				toast.error("Error updating item status: " + error);
				scheduleFetchOrders();
			} finally {
				processingCountRef.current -= 1;
				if (processingCountRef.current === 0 && pendingUpdateRef.current) {
					scheduleFetchOrders();
				}
			}
		},
		[orders, scheduleFetchOrders]
	);

	const handleOrderStatus = useCallback(
		async (
			orderId: number,
			status = "",
			skipItemUpdate = false,
			manualOrder?: KDSOrder
		) => {
			const order = manualOrder ?? orders.find((order) => order.id === orderId);
			if (!order) {
				toast.error(
					`Order with id ${orderId} not found, can't update status to ${status}`
				);
				return;
			}

			processingCountRef.current += 1;

			if (status === "") {
				status =
					order.status === "pending"
						? "ready"
						: order.status === "ready"
						? "fulfilled"
						: "pending";
			}

			try {
				const updatedOrders = [...orders];
				const targetOrderIndex = updatedOrders.findIndex(
					(o) => o.id === orderId
				);

				// only mutate items if skipItemUpdate is false
				const updatedOrder = {
					...order,
					status,
					items: skipItemUpdate
						? order.items // leave items as-is
						: order.items.map((item) => ({
								...item,
								prepared_quantity:
									status === "ready" || status === "fulfilled"
										? item.quantity
										: 0,
								fulfilled_quantity: status === "fulfilled" ? item.quantity : 0,
						  })),
				};

				if (targetOrderIndex !== -1) {
					const isPickupAndDone = mode === "pickup" && status === "fulfilled";
					const isKitchenAndDone = mode === "kitchen" && status === "ready";

					if (isPickupAndDone || isKitchenAndDone) {
						updatedOrders.splice(targetOrderIndex, 1);
					} else {
						updatedOrders[targetOrderIndex] = updatedOrder;
					}
					setOrders(updatedOrders);
				}

				const response = await fetch(
					`/api/kds-orders/${orderId}/mark-${status}?skipItemUpdate=${skipItemUpdate}`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json; charset=UTF-8",
							Authorization: `Bearer ${sessionStorage.getItem("token")}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error(
						`Error marking order ${status}: ${response.statusText}`
					);
				}
			} catch (error) {
				toast.error(`Error marking order ${status}: ${error}`);
				scheduleFetchOrders();
			} finally {
				processingCountRef.current -= 1;
				if (processingCountRef.current === 0 && pendingUpdateRef.current) {
					scheduleFetchOrders();
				}
			}
		},
		[orders, mode, scheduleFetchOrders]
	);

	const restoreOrder = useCallback(
		async (orderId: number) => {
			processingCountRef.current += 1;
			const order = orders.find((o) => o.id === orderId);

			const shouldRemove = mode === "pickup" && order.status === "fulfilled";

			if (shouldRemove) {
				const updatedOrders = orders.filter((o) => o.id !== orderId);
				setOrders(updatedOrders);
			}

			try {
				// Optimistically update items as well
				const updatedOrders = [...orders];
				const index = updatedOrders.findIndex((o) => o.id === orderId);
				if (index !== -1) {
					updatedOrders[index] = {
						...order,
						status: "pending",
						items: order.items.map((item) => ({
							...item,
							prepared_quantity: 0,
							fulfilled_quantity: 0,
						})),
					};
					setOrders(updatedOrders);
				}

				const response = await fetch(
					`/api/kds-orders/${orderId}/mark-pending`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json; charset=UTF-8",
							Authorization: `Bearer ${sessionStorage.getItem("token")}`,
						},
					}
				);

				if (!response.ok) {
					throw new Error(
						`Error marking order pending: ${response.statusText}`
					);
				}
			} catch (error) {
				toast.error("Error marking order pending: " + error);
				scheduleFetchOrders();
			} finally {
				processingCountRef.current -= 1;
				if (processingCountRef.current === 0 && pendingUpdateRef.current) {
					scheduleFetchOrders();
				}
			}
		},
		[orders, mode, scheduleFetchOrders]
	);

	useLayoutEffect(() => {
		const getAvailableHeight = (): number => {
			const carousel = document.querySelector(".kds-carousel");
			return carousel ? carousel.clientHeight : window.innerHeight * 0.95;
		};
		//set initial window height
		const updateHeight = () => setAvailableHeight(getAvailableHeight());

		updateHeight();
		window.addEventListener("resize", updateHeight);

		return () => window.removeEventListener("resize", updateHeight);
	}, []);

	useEffect(() => {
		const endpoint = window.location.origin;
		const socket = io(endpoint, {
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 10000,
			timeout: 20000,
		});

		// -- expose for quick dev fiddling (`window.__socket.DISCONNECT()` etc.)
		(window as any).__socket = socket;

		// tracks the “lost-link” toast so we can update/dismiss it
		let lossToast: string | number | null = null;

		/** clear or update the reconnecting toast */
		const clearToast = (attempt?: number) => {
			if (lossToast == null) return;

			toast.update(lossToast, {
				render: attempt
					? `Reconnected after ${attempt} attempt${attempt > 1 ? "s" : ""}`
					: "Realtime link re-established",
				type: "success",
				autoClose: 4000,
			});
			lossToast = null;
		};

		/** mark connection healthy in UI + toast */
		const markUp = (attempt?: number) => {
			clearToast(attempt);
		};

		/** mark connection lost in UI + toast */
		const markDown = () => {
			if (lossToast == null) {
				lossToast = toast.warn(
					"Realtime link lost… if issue persists, please restart the application",
					{
						autoClose: false,
					}
				);
			}
		};

		const handleUpdate = () => {
			if (processingCountRef.current > 0) {
				pendingUpdateRef.current = true;
				return;
			}
			fetchKDSOrders();
		};

		socket.on("connect", () => markUp());
		socket.on("reconnect", (n) => markUp(n));
		socket.on("disconnect", markDown);
		socket.on("reconnect_error", markDown);
		socket.on("reconnect_failed", markDown);

		socket.on("kds_update", handleUpdate);

		return () => {
			socket.off();
			socket.disconnect();
		};
	}, [fetchKDSOrders]);

	useEffect(() => {
		//handle carousel wheel events
		const carousel = document.querySelector(".kds-carousel");
		if (!carousel) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			const scrollSpeed = 15; // Adjust this factor to increase sensitivity
			carousel.scrollLeft += e.deltaY * scrollSpeed + e.deltaX * scrollSpeed;
		};

		carousel.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			carousel.removeEventListener("wheel", handleWheel);
		};
	}, []);

	useEffect(() => {
		//fetch initial orders
		fetchKDSOrders();
	}, [fetchKDSOrders]);

	const summary = useMemo(() => {
		// create item summary for footer
		const itemSummary: Record<string, { count: number; color: string }> = {};
		orders.forEach((order) => {
			order.items.forEach((item) => {
				const unpreparedCount = item.quantity - item.prepared_quantity;
				if (unpreparedCount > 0) {
					itemSummary[item.item_name] ||= {
						count: 0,
						color: `station-${item.station}`,
					};
					itemSummary[item.item_name].count += unpreparedCount;
				}
			});
		});

		//add total number of orders to end of summary
		itemSummary["Total Orders"] = {
			count: orders.length,
			color: "#AAAAAA",
		};

		return itemSummary;
	}, [orders]);

	const HEADER_HEIGHT = 32; // Header/footer in pixels
	const ITEM_HEIGHT = 45; // Single line item height
	const INSTRUCTION_HEIGHT = 30; // Per instruction line
	const PADDING_HEIGHT = 24; // Padding per order

	const splitOrders = useMemo(() => {
		return orders.flatMap((order) => {
			const subOrders: KDSOrder[] = [];
			let currentItems: KDSItem[] = [];
			let currentHeight = HEADER_HEIGHT + PADDING_HEIGHT;

			order.items.forEach((item, idx) => {
				const itemHeight =
					ITEM_HEIGHT +
					(item.special_instructions
						? item.special_instructions.split(",").length * INSTRUCTION_HEIGHT
						: 0);

				// Check if adding the item exceeds max height
				if (
					currentHeight + itemHeight > availableHeight * 0.95 &&
					currentItems.length > 0
				) {
					// Start new sub-order
					subOrders.push({
						...order,
						items: currentItems,
						continued: true,
						isFirst: subOrders.length === 0,
						isLast: false,
					});
					currentItems = [item];
					currentHeight = HEADER_HEIGHT + PADDING_HEIGHT + itemHeight;
				} else {
					currentItems.push(item);
					currentHeight += itemHeight;
				}

				// Final item handling
				if (idx === order.items.length - 1 && currentItems.length) {
					subOrders.push({
						...order,
						items: currentItems,
						isFirst: subOrders.length === 0,
						isLast: true,
					});
				}
			});

			return subOrders.map((subOrder, index) => ({
				...subOrder,
				isFirst: index === 0,
				isLast: index === subOrders.length - 1,
			}));
		});
	}, [orders, availableHeight]);

	return (
		<div className="kds-container">
			<div className="kds-carousel">
				{splitOrders.map((order, index) => (
					<KdsOrderBlock
						key={`${order.id}-${index}`}
						order={order}
						handleOrderStatus={handleOrderStatus}
						handleItemToggle={handleItemToggle}
						restoreOrder={restoreOrder}
						mode={mode}
					/>
				))}
			</div>
			{mode === "kitchen" && (
				<div className="kds-summary">
					<ul>
						{Object.entries(summary).map(([itemName, { count, color }]) => (
							<li key={itemName} className={color}>
								{itemName}: {count}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default KDS;
