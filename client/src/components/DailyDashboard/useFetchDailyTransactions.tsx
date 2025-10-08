import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import moment from "moment-timezone";
import { io, Socket } from "socket.io-client";

export interface Transaction {
	id: string;
	amount: number;
	gateway: string;
	processedAt: string;
	orderId: string;
	orderName?: string;
	fees: number;
	taxTotal: number;
	source: "online" | "POS";
	refundItems?: any[];
	items?: any[];
	customer?: {
		displayName?: string;
		email?: string;
	};
}

interface UseFetchDailyTransactionsReturn {
	transactions: Transaction[];
	loading: boolean;
	error: string | null;
	totalSales: number;
	refetch: () => void;
	update: () => void;
	pagesFetched: number;
	hasNewTransactions: boolean;
	canUpdate: boolean;
}

export function useFetchDailyTransactions(
	targetDate?: string
): UseFetchDailyTransactionsReturn {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [totalSales, setTotalSales] = useState(0);
	const [pagesFetched, setPagesFetched] = useState(0);
	const [lastCursor, setLastCursor] = useState<string>("");
	const [lastFetchDate, setLastFetchDate] = useState<string>("");
	const [hasNewTransactions, setHasNewTransactions] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);
	const activeRequestRef = useRef<Promise<any> | null>(null);
	const socketRef = useRef<Socket | null>(null);

	const { startDate, endDate } = useMemo(() => {
		const date = targetDate
			? moment.tz(targetDate, "America/Chicago")
			: moment.tz("America/Chicago");
		const dayStart = date.startOf("day");
		//console.log("new date:", dayStart.format("YYYY-MM-DD"));
		return {
			startDate: dayStart.format("YYYY-MM-DD"),
			endDate: dayStart.format("YYYY-MM-DD"),
		};
	}, [targetDate]);

	const processTransaction = (node: any): Transaction | null => {
		if (!node?.order) return null;

		// Ensure amount is a number
		const amount = Number(node.amount.amount);
		const processedAt = node.processedAt;
		const orderId = node.order.id;
		const orderName = node.order.name;

		// Determine gateway
		let gateway = "Other";
		const transaction = node.order.transactions?.find(
			(trans: any) =>
				Number(trans.amountSet.shopMoney.amount) === Math.abs(amount) &&
				trans.kind !== "AUTHORIZATION"
		);

		if (transaction) {
			gateway = transaction.formattedGateway || "Other";
		}
		if (gateway === "Na") return null;

		// Calculate fees as number
		let fees = 0;
		if (gateway?.includes("Stripe") || gateway === "Manual") {
			fees = Number((amount * 0.029 + 0.3).toFixed(2));
		} else if (gateway?.includes("Shopify Payments")) {
			fees = Number((amount * 0.029 + 0.3).toFixed(2));
		}

		// Calculate tax as number
		const taxLines = node.order?.taxLines || [];
		let taxTotal = 0;
		taxLines.forEach((line: any) => {
			taxTotal += Number(line.priceSet.shopMoney.amount);
		});

		// Determine source
		const source =
			gateway === "Cash" ||
			gateway === "Quickbooks Payments" ||
			gateway === "ACH"
				? "POS"
				: "online";

		return {
			id: node.id,
			amount,
			gateway: gateway === "Manual" ? "Stripe" : gateway,
			processedAt,
			orderId,
			orderName,
			fees,
			taxTotal: Number(taxTotal.toFixed(2)),
			source,
			customer: node.order.customer,
			items: node.order?.lineItems?.edges || [],
			refundItems: [],
		};
	};

	const fetchTransactionsPage = async (
		cursor = "",
		accumulatedTransactions: Transaction[] = []
	): Promise<{ transactions: Transaction[]; lastCursor: string }> => {
		//const { startDate, endDate } = getDateRange();
		//console.log("fetching transactions for:", startDate, endDate);
		
    // Build query parameters
		const params = new URLSearchParams({
			startDate,
			endDate,
			num: "250",
      cursor,
		});

		const response = await fetch(`/api/tender-transactions?${params}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${sessionStorage.getItem("token")}`,
			},
			signal: abortControllerRef.current?.signal,
		});

		const data = await response.json();

		if (data.errors) {
			throw new Error(
				data.errors[0]?.message || "Failed to fetch transactions"
			);
		}

		const edges = data.data?.tenderTransactions?.edges || [];
		const pageInfo = data.data?.tenderTransactions?.pageInfo;

		// Process transactions from this page
		const pageTransactions: Transaction[] = [];
		for (const edge of edges) {
			const transaction = processTransaction(edge.node);
			if (transaction) {
				pageTransactions.push(transaction);
			}
		}

		// Combine with accumulated transactions
		const allTransactions = [...accumulatedTransactions, ...pageTransactions];

		// Get the current cursor (from the last edge)
		let currentCursor = cursor;
		if (edges.length > 0) {
			currentCursor = edges[edges.length - 1].cursor;
		}

		// If there are more pages, fetch them recursively with throttling
		if (pageInfo?.hasNextPage && edges.length > 0) {
			const nextCursor = edges[edges.length - 1].cursor;

			// Check if we need to wait due to rate limiting
			const cost = data.extensions?.cost?.actualQueryCost || 0;
			const available =
				data.extensions?.cost?.throttleStatus?.currentlyAvailable || 1000;
			const restoreRate =
				data.extensions?.cost?.throttleStatus?.restoreRate || 50;

			let waitTime = 0;
			if (cost > available) {
				waitTime = ((cost - available) / restoreRate) * 1000;
			}

			if (waitTime > 0) {
				console.log(`Rate limited, waiting ${waitTime}ms before next page`);
				await new Promise((resolve) => setTimeout(resolve, waitTime));
			}

			setPagesFetched((prev) => prev + 1);
			return fetchTransactionsPage(nextCursor, allTransactions);
		}

		return { transactions: allTransactions, lastCursor: currentCursor };
	};

	const fetchTransactions = useCallback(
		async (forceFullRefresh = false) => {
			// Prevent multiple simultaneous requests
			if (activeRequestRef.current) {
				//console.log("Request already in progress, skipping");
				return;
			}

			// Cancel any in-flight requests
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller for this request
			abortControllerRef.current = new AbortController();

			setLoading(true);
			setError(null);
			setPagesFetched(0);

			try {
				// Create request promise and store reference
				const requestPromise = (async () => {
					// Do full fetch to avoid stale closure issues
					//console.log("Doing full refresh");
					const result = await fetchTransactionsPage();
					const allTransactions = result.transactions;
					const newCursor = result.lastCursor;

					setLastFetchDate(startDate);

					// Update cursor
					if (newCursor) {
						setLastCursor(newCursor);
					}

					setTransactions(allTransactions);

					// Calculate total sales
					const total = allTransactions.reduce(
						(sum, trans) => sum + trans.amount,
						0
					);
					setTotalSales(total);

					//console.log(`Total transactions: ${allTransactions.length}`);
				})();

				activeRequestRef.current = requestPromise;
				await requestPromise;
			} catch (err: any) {
				if (err.name !== "AbortError") {
					//console.error("Error fetching transactions:", err);
					setError(err instanceof Error ? err.message : "An error occurred");
				}
			} finally {
				activeRequestRef.current = null;
				setLoading(false);
			}
		},
		[startDate] // Only depend on startDate to prevent loops
	);

	const updateTransactions = useCallback(
		async () => {
			// Can't update if no cursor or wrong date
			if (lastFetchDate !== startDate) {
				console.log("Cannot update: no cursor or date mismatch");
				return;
			}

			// Prevent multiple simultaneous requests
			if (activeRequestRef.current) {
				return;
			}

			// Cancel any in-flight requests
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller for this request
			abortControllerRef.current = new AbortController();

			setIsUpdating(true);
			setError(null);
			setHasNewTransactions(false);

			try {
				// Create request promise and store reference
				const requestPromise = (async () => {
					// Fetch from the last known cursor
					const result = await fetchTransactionsPage(lastCursor || '');
					const newTransactions = result.transactions;
					const newCursor = result.lastCursor;

					// Update cursor
					if (newCursor) {
						setLastCursor(newCursor);
					}

					// Only add truly new transactions (ones not already in our list)
					const existingIds = new Set(transactions.map(t => t.id));
					const filteredNewTransactions = newTransactions.filter(t => !existingIds.has(t.id));

					if (filteredNewTransactions.length > 0) {
						// Append new transactions to existing ones
						setTransactions(prevTransactions => [...prevTransactions, ...filteredNewTransactions]);

						// Update total sales
						const newTotal = totalSales + filteredNewTransactions.reduce(
							(sum, trans) => sum + trans.amount,
							0
						);
						setTotalSales(newTotal);

						setHasNewTransactions(true);
						console.log(`Added ${filteredNewTransactions.length} new transactions`);
					} else {
						console.log("No new transactions found");
					}
				})();

				activeRequestRef.current = requestPromise;
				await requestPromise;
			} catch (err: any) {
				if (err.name !== "AbortError") {
					console.error("Error updating transactions:", err);
					setError(err instanceof Error ? err.message : "An error occurred");
				}
			} finally {
				activeRequestRef.current = null;
				setIsUpdating(false);
			}
		},
		[lastCursor, lastFetchDate, startDate, transactions, totalSales]
	);

	// Compute if update functionality should be available
	const canUpdate = useMemo(() => {
		const isToday = startDate === moment.tz("America/Chicago").format("YYYY-MM-DD");
		return isToday && lastCursor && lastFetchDate === startDate;
	}, [startDate, lastCursor, lastFetchDate]);

	// Reset state when target date changes
	useEffect(() => {
		setTransactions([]);
		setLastCursor("");
		setLastFetchDate("");
		setTotalSales(0);
		setError(null);
		setHasNewTransactions(false);
		setIsUpdating(false);
	}, [targetDate]);

	// Socket.IO listener effect - mirrors KDS pattern
	useEffect(() => {


			// Only set up socket if we're viewing today's transactions
			const isToday = startDate === moment.tz("America/Chicago").format("YYYY-MM-DD");
			if (!isToday) {
				return;
			}
			const endpoint = window.location.origin;
			const socket = io(endpoint, {
				reconnection: true,
				reconnectionAttempts: Infinity,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 10000,
				timeout: 20000,
			});

			// Store socket reference
			socketRef.current = socket;

			// Handle transaction update events
			const handleTransactionUpdate = (payload: string) => {
				console.log("Transaction update received:", payload);

				// Only update if we're viewing today's transactions
				const isToday = startDate === moment.tz("America/Chicago").format("YYYY-MM-DD");
				if (isToday && canUpdate) {
					// Use the update function to fetch only new transactions
					updateTransactions();
				}
		};

		socket.on("transaction_update", handleTransactionUpdate);

		// Cleanup socket on unmount
		return () => {
			socket.off("transaction_update", handleTransactionUpdate);
			socket.disconnect();
			socketRef.current = null;
		};
	}, [startDate, updateTransactions]);

	useEffect(() => {
		//console.log("useEffect called, targetDate:", targetDate);
		// Force full refresh on first load or date change
		fetchTransactions(true);

		// Only set up auto-refresh for today's date (not historical dates)
		const isToday =
			targetDate === moment.tz("America/Chicago").format("YYYY-MM-DD");
		let interval: ReturnType<typeof setInterval> | null = null;

		if (isToday) {
			// Reduced interval since we have real-time updates now
			interval = setInterval(() => fetchTransactions(false), 300000); // 5 minutes instead of 1 minute
		}

		return () => {
			// Clear interval first
			if (interval) {
				clearInterval(interval);
				interval = null;
			}

			// Cancel any in-flight requests
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
				abortControllerRef.current = null;
			}

			// Cancel active request promise
			if (activeRequestRef.current) {
				activeRequestRef.current = null;
			}
		};
	}, [targetDate]); // Remove fetchTransactions to prevent infinite loop

	// Create a separate refetch function that forces full refresh
	const refetch = useCallback(() => {
		fetchTransactions(true);
	}, [fetchTransactions]);

	return {
		transactions,
		loading: loading || isUpdating,
		error,
		totalSales,
		refetch,
		update: updateTransactions,
		pagesFetched,
		hasNewTransactions,
		canUpdate,
	};
}
