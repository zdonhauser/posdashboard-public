/**
 * Order Routes
 * Defines all order, fulfillment, and party booking-related API endpoints
 */

import { Router } from 'express';
import * as orderController from '../controllers/orderController';

const router = Router();

/**
 * @route   POST /api/get-orders
 * @desc    Get orders by IDs from Shopify
 * @access  Protected (requires JWT authentication)
 * @body    { orderIds: string[] } - Array of order IDs (max 250)
 */
router.post('/get-orders', orderController.getOrders);

/**
 * @route   POST /api/order-search/
 * @desc    Search orders by query term
 * @access  Protected (requires JWT authentication)
 * @body    { term: string } - Search query term
 */
router.post('/order-search/', orderController.searchOrders);

/**
 * @route   POST /api/order-id-search/
 * @desc    Search order IDs by query term
 * @access  Protected (requires JWT authentication)
 * @body    { term: string } - Search query term
 */
router.post('/order-id-search/', orderController.searchOrderIds);

/**
 * @route   POST /api/fulfillment-order-search/
 * @desc    Search fulfillment orders
 * @access  Protected (requires JWT authentication)
 * @body    { term: string, num?: number, items?: number, cursor?: string, forward?: boolean, fulfillmentItems?: number, lineItems?: number }
 */
router.post('/fulfillment-order-search/', orderController.searchFulfillmentOrders);

/**
 * @route   POST /api/fulfill/
 * @desc    Create a fulfillment (V1)
 * @access  Protected (requires JWT authentication)
 * @body    { input: FulfillmentInput }
 */
router.post('/fulfill/', orderController.fulfill);

/**
 * @route   POST /api/fulfillv2/
 * @desc    Create a fulfillment (V2)
 * @access  Protected (requires JWT authentication)
 * @body    { input: { lineItems: any[], notify: boolean } }
 */
router.post('/fulfillv2/', orderController.fulfillV2);

/**
 * @route   POST /api/cancel-order
 * @desc    Cancel an order using GraphQL
 * @access  Protected (requires JWT authentication)
 * @body    { orderId: string, refund?: boolean, email?: boolean, restock?: boolean, reason?: string, staffNote?: string }
 */
router.post('/cancel-order', orderController.cancelOrder);

/**
 * @route   POST /api/cancel-fulfill/
 * @desc    Cancel a fulfillment
 * @access  Protected (requires JWT authentication)
 * @body    { fulId: string } - Fulfillment ID to cancel
 */
router.post('/cancel-fulfill/', orderController.cancelFulfillment);

/**
 * @route   POST /api/order-update/
 * @desc    Update an order
 * @access  Protected (requires JWT authentication)
 * @body    { input: OrderInput }
 */
router.post('/order-update/', orderController.updateOrder);

/**
 * @route   GET /api/party-info/:id
 * @desc    Get party information by order ID
 * @access  Protected (requires JWT authentication)
 * @params  id - Order search query
 */
router.get('/party-info/:id', orderController.getPartyInfo);

/**
 * @route   POST /api/create-draft-order
 * @desc    Create a draft order
 * @access  Protected (requires JWT authentication)
 * @body    DraftOrderInput
 */
router.post('/create-draft-order', orderController.createDraftOrder);

/**
 * @route   POST /api/update-draft-order
 * @desc    Update a draft order
 * @access  Protected (requires JWT authentication)
 * @body    { id: string, input: DraftOrderInput }
 */
router.post('/update-draft-order', orderController.updateDraftOrder);

/**
 * @route   POST /api/complete-order
 * @desc    Complete a draft order
 * @access  Protected (requires JWT authentication)
 * @body    { id: string } - Draft order ID
 */
router.post('/complete-order', orderController.completeOrder);

/**
 * @route   POST /api/cancel
 * @desc    Create a refund (cancel line item)
 * @access  Protected (requires JWT authentication)
 * @body    { orderId: string, lineItemId: string }
 */
router.post('/cancel', orderController.cancel);

/**
 * @route   POST /api/create-order
 * @desc    Create an order via REST API
 * @access  Protected (requires JWT authentication)
 * @body    Order data object
 */
router.post('/create-order', orderController.createOrder);

/**
 * @route   POST /api/order-note
 * @desc    Update order note
 * @access  Protected (requires JWT authentication)
 * @body    { orderId: string, note: string }
 */
router.post('/order-note', orderController.updateOrderNote);

/**
 * @route   GET /api/search-order/:orderId
 * @desc    Search order by ID with transactions
 * @access  Protected (requires JWT authentication)
 * @params  orderId - Order ID(s) to search (comma-separated)
 */
router.get('/search-order/:orderId', orderController.searchOrderById);

/**
 * @route   GET /api/get-fulfillment-orders/:orderId
 * @desc    Get fulfillment orders by order ID
 * @access  Protected (requires JWT authentication)
 * @params  orderId - Order ID
 */
router.get('/get-fulfillment-orders/:orderId', orderController.getFulfillmentOrders);

/**
 * @route   POST /api/batch-fulfill-orders/
 * @desc    Batch fulfill orders
 * @access  Protected (requires JWT authentication)
 * @body    { fulfillmentOrderIds: string[], notify: boolean, orderId: string }
 */
router.post('/batch-fulfill-orders/', orderController.batchFulfillOrders);

/**
 * Party Booking Endpoints
 */

/**
 * @route   GET /api/party-dates
 * @desc    Get party dates (available party room products)
 * @access  Protected (requires JWT authentication)
 */
router.get('/party-dates', orderController.getPartyDates);

/**
 * @route   GET /api/party-times/:date
 * @desc    Get party times for a specific date
 * @access  Protected (requires JWT authentication)
 * @params  date - Date to search for party times
 */
router.get('/party-times/:date', orderController.getPartyTimes);

export default router;
