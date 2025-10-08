/**
 * Transaction Routes
 * Defines all transaction and tender-related API endpoints
 */

import { Router } from "express";
import * as transactionController from "../controllers/transactionController";

const router = Router();

/**
 * @route   POST /api/fetch-transactions
 * @desc    Fetch transactions by email and date range from Shopify
 * @access  Protected (requires JWT authentication)
 * @body    { emails: string[], startDate?: string, endDate?: string }
 */
router.post("/fetch-transactions", transactionController.fetchTransactions);

/**
 * @route   GET /api/transactions/unsettled
 * @desc    Get all unsettled transactions from database
 * @access  Protected (requires JWT authentication)
 */
router.get(
  "/transactions/unsettled",
  transactionController.getUnsettledTransactions
);

/**
 * @route   GET /api/items/unsettled
 * @desc    Get all unsettled line items from database
 * @access  Protected (requires JWT authentication)
 */
router.get("/items/unsettled", transactionController.getUnsettledItems);

/**
 * @route   POST /api/transactions/settle
 * @desc    Settle transactions by ID
 * @access  Protected (requires JWT authentication)
 * @body    { transactionIds: string[] }
 */
router.post("/transactions/settle", transactionController.settleTransactions);

/**
 * @route   POST /api/items/settle
 * @desc    Settle line items by ID
 * @access  Protected (requires JWT authentication)
 * @body    { itemIds: string[] }
 */
router.post("/items/settle", transactionController.settleItems);

/**
 * @route   POST /api/tender-transactions
 * @desc    Fetch tender transactions from Shopify (reverse order)
 * @access  Protected (requires JWT authentication)
 * @body    { startDate: string, endDate: string, num: number, cursor?: string }
 */
router.post(
  "/tender-transactions",
  transactionController.fetchTenderTransactionsPost
);

/**
 * @route   GET /api/tender-transactions
 * @desc    Fetch tender transactions from Shopify (normal order)
 * @access  Protected (requires JWT authentication)
 * @query   startDate, endDate, num, cursor
 */
router.get(
  "/tender-transactions",
  transactionController.fetchTenderTransactionsGet
);

/**
 * @route   POST /api/tender-count
 * @desc    Fetch tender transaction count from Shopify
 * @access  Protected (requires JWT authentication)
 * @body    { startDate: string, endDate: string, num: number, cursor?: string }
 */
router.post("/tender-count", transactionController.fetchTenderCount);

export default router;
