/**
 * Customer Routes
 * Defines all customer-related API endpoints
 */

import { Router } from 'express';
import * as customerController from '../controllers/customerController';

const router = Router();

/**
 * @route   POST /api/search-customers
 * @desc    Search customers by query
 * @access  Protected (requires JWT authentication)
 * @body    { query: string } - Search query
 */
router.post('/search-customers', customerController.searchCustomers);

/**
 * @route   POST /api/customer
 * @desc    Create a new Shopify customer
 * @access  Protected (requires JWT authentication)
 * @body    { firstName: string, lastName: string, email: string }
 */
router.post('/customer', customerController.createCustomer);

/**
 * @route   GET /api/customers/:query
 * @desc    Get customers by query using GraphQL
 * @access  Protected (requires JWT authentication)
 * @params  query - Customer search query
 */
router.get('/customers/:query', customerController.getCustomers);

/**
 * @route   GET /api/customers/:identifier/store-credit
 * @desc    Get customer store credit by identifier (ID or email)
 * @access  Protected (requires JWT authentication)
 * @params  identifier - Customer ID (numeric) or email address
 */
router.get('/customers/:identifier/store-credit', customerController.getCustomerStoreCredit);

/**
 * @route   PUT /api/customers/:id/store-credit
 * @desc    Update customer store credit (credit or debit)
 * @access  Protected (requires JWT authentication)
 * @params  id - Store credit account ID or customer ID
 * @body    { amount: number, currencyCode: string, type: 'credit' | 'debit' }
 */
router.put('/customers/:id/store-credit', customerController.updateCustomerStoreCredit);

export default router;
