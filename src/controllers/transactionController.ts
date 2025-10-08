/**
 * Transaction Controller
 * Handles HTTP requests for transaction and tender operations
 */

import { Request, Response } from "express";
import * as transactionService from "../services/transactionService";

/**
 * Fetch transactions by email and date range
 */
export async function fetchTransactions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { emails, startDate, endDate } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      res.status(400).send("Emails must be a non-empty array.");
      return;
    }

    const transactions = await transactionService.fetchTransactions(
      emails,
      startDate,
      endDate
    );
    res.json(transactions);
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Error fetching transactions");
  }
}

/**
 * Get unsettled transactions
 */
export async function getUnsettledTransactions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const transactions = await transactionService.getUnsettledTransactions();
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching unsettled transactions:", error);
    res.status(500).send("Server error");
  }
}

/**
 * Get unsettled line items
 */
export async function getUnsettledItems(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const items = await transactionService.getUnsettledItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching unsettled items:", error);
    res.status(500).send("Server error");
  }
}

/**
 * Settle transactions
 */
export async function settleTransactions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !transactionIds.length) {
      res.status(200).send("No transaction IDs provided");
      return;
    }

    const settled = await transactionService.settleTransactions(transactionIds);
    res.json(settled);
  } catch (error) {
    console.error("Error updating settlement date:", error);
    res.status(500).send("Server error");
  }
}

/**
 * Settle line items
 */
export async function settleItems(req: Request, res: Response): Promise<void> {
  try {
    const { itemIds } = req.body;

    if (!itemIds || !itemIds.length) {
      res.status(200).send("No item IDs provided");
      return;
    }

    const settled = await transactionService.settleItems(itemIds);
    res.json(settled);
  } catch (error) {
    console.error("Error updating settlement date:", error);
    res.status(500).send("Server error");
  }
}

/**
 * Fetch tender transactions (POST - with reverse order)
 */
export async function fetchTenderTransactionsPost(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { startDate, endDate, num, cursor } = req.body;
    const data = await transactionService.fetchTenderTransactionsPost(
      startDate,
      endDate,
      num,
      cursor
    );
    res.send(data);
  } catch (error: any) {
    console.error("Error fetching tender transactions:", error.message);
    res.status(500).send("Error fetching tender transactions");
  }
}

/**
 * Fetch tender transactions (GET - without reverse order)
 */
export async function fetchTenderTransactionsGet(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { startDate, endDate, cursor, num } = req.query;
    const data = await transactionService.fetchTenderTransactionsGet(
      startDate as string,
      endDate as string,
      parseInt(num as string),
      cursor as string | undefined
    );
    res.send(data);
  } catch (error: any) {
    console.error("Error fetching tender transactions:", error.message);
    res.status(500).send("Error fetching tender transactions");
  }
}

/**
 * Fetch tender transaction count
 */
export async function fetchTenderCount(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { startDate, endDate, num, cursor } = req.body;
    const data = await transactionService.fetchTenderCount(
      startDate,
      endDate,
      num,
      cursor
    );
    res.send(data);
  } catch (error: any) {
    console.error("Error fetching tender count:", error.message);
    res.status(500).send("Error fetching tender count");
  }
}
