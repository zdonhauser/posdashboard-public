/**
 * KDS (Kitchen Display System) Routes
 * Defines all KDS-related API endpoints
 */

import { Router } from 'express';
import * as kdsController from '../controllers/kdsController';

const router = Router();

/**
 * @route   GET /api/kds-orders
 * @desc    Get KDS orders with optional filtering
 * @access  Protected (requires JWT authentication)
 * @query   status - Filter by order status (optional, 'all' for all statuses)
 * @query   status2 - Additional status filter (optional)
 * @query   order_by - Sort by field: 'id', 'created_at', or 'updated_at' (optional, defaults to 'id')
 */
router.get('/kds-orders', kdsController.getKDSOrders);

/**
 * @route   POST /api/kds-order
 * @desc    Create a new KDS order
 * @access  Protected (requires JWT authentication)
 * @body    { pos_order_id: string, order_number: string, items: KDSOrderItem[], status: string, name?: string }
 */
router.post('/kds-order', kdsController.createKDSOrder);

/**
 * @route   POST /api/kds-items/:id/:status
 * @desc    Update KDS item status
 * @access  Protected (requires JWT authentication)
 * @params  id - Item ID
 * @params  status - New status: 'mark-prepared', 'mark-fulfilled', 'unmark', or 'mark-pending'
 */
router.post('/kds-items/:id/:status', kdsController.updateKDSItemStatus);

/**
 * @route   POST /api/kds-orders/:id/:status
 * @desc    Update KDS order status
 * @access  Protected (requires JWT authentication)
 * @params  id - Order ID or POS order ID
 * @params  status - New status: 'mark-ready', 'mark-fulfilled', or 'mark-pending'
 * @query   skipItemUpdate - Skip updating items (optional, boolean)
 */
router.post('/kds-orders/:id/:status', kdsController.updateKDSOrderStatus);

export default router;
