/**
 * KDS Controller
 * Handles HTTP requests for Kitchen Display System operations
 */

import { Request, Response } from 'express';
import * as kdsService from '../services/kdsService';

/**
 * GET /api/kds-orders
 * Get KDS orders with optional filtering
 */
export async function getKDSOrders(req: Request, res: Response): Promise<void> {
  try {
    const { status, status2, order_by } = req.query;

    const orders = await kdsService.getKDSOrders(
      status as string | undefined,
      status2 as string | undefined,
      order_by as string | undefined
    );

    res.json(orders);
  } catch (error) {
    console.error("Error fetching KDS orders:", error);
    res.status(500).json({ error: "Failed to fetch KDS orders" });
  }
}

/**
 * POST /api/kds-order
 * Create a new KDS order
 */
export async function createKDSOrder(req: Request, res: Response): Promise<void> {
  try {
    const result = await kdsService.createKDSOrder(req.body);
    res.json(result);
  } catch (error: any) {
    console.error("Error creating KDS order:", error);
    if (error.message.includes("Invalid payload")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to create KDS order" });
    }
  }
}

/**
 * POST /api/kds-items/:id/:status
 * Update KDS item status
 */
export async function updateKDSItemStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id: itemId, status } = req.params;
    const result = await kdsService.updateKDSItemStatus(itemId, status);
    res.json(result);
  } catch (error: any) {
    console.error(`Error updating item status:`, error);
    if (error.message.includes("Invalid status")) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes("does not exist")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to mark item as ${req.params.status}` });
    }
  }
}

/**
 * POST /api/kds-orders/:id/:status
 * Update KDS order status
 */
export async function updateKDSOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const orderId = req.params.id;
    const statusParam = req.params.status;
    const status = statusParam.split("-")[1];
    const skipItemUpdate: boolean = req.query.skipItemUpdate
      ? (req.query.skipItemUpdate as string) === "true"
      : false;

    const result = await kdsService.updateKDSOrderStatus(orderId, status, skipItemUpdate);
    res.json(result);
  } catch (error: any) {
    console.error(`Error marking order as ${req.params.status}:`, error);
    if (error.message.includes("Invalid status")) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes("not found")) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: `Failed to mark order as ${req.params.status}` });
    }
  }
}
