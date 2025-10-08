/**
 * Order Controller
 * Handles HTTP requests for order and fulfillment operations
 */

import { Request, Response } from 'express';
import * as orderService from '../services/orderService';

/**
 * POST /api/get-orders
 * Get orders by IDs from Shopify
 */
export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const orderIds = req.body.orderIds;

    if (!orderIds || orderIds.length > 250) {
      res.status(400).send('OrderIds are required and can\'t be more than 250.');
      return;
    }

    const data = await orderService.getOrdersByIds(orderIds);
    res.send(data);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).send('Internal Server Error');
  }
}

/**
 * POST /api/order-search/
 * Search orders by query term
 */
export async function searchOrders(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.searchOrders(req.body.term);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/order-id-search/
 * Search order IDs by query term
 */
export async function searchOrderIds(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.searchOrderIds(req.body.term);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/fulfillment-order-search/
 * Search fulfillment orders
 */
export async function searchFulfillmentOrders(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await orderService.searchFulfillmentOrders({
      term: req.body.term,
      num: req.body.num,
      items: req.body.items,
      cursor: req.body.cursor,
      forward: req.body.forward,
      fulfillmentItems: req.body.fulfillmentItems,
      lineItems: req.body.lineItems,
    });
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/fulfill/
 * Create a fulfillment (V1)
 */
export async function fulfill(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.createFulfillment(req.body.input);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/fulfillv2/
 * Create a fulfillment (V2)
 */
export async function fulfillV2(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.createFulfillmentV2({
      lineItems: req.body.input.lineItems,
      notify: req.body.input.notify,
    });
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/cancel-order
 * Cancel an order using GraphQL
 */
export async function cancelOrder(req: Request, res: Response): Promise<void> {
  try {
    const {
      orderId,
      refund = true,
      email = false,
      restock = true,
      reason = 'OTHER',
      staffNote,
    } = req.body;

    if (!orderId || !reason) {
      res
        .status(400)
        .send('orderId and reason are required for a GraphQL cancellation.');
      return;
    }

    const job = await orderService.cancelOrder({
      orderId,
      refund,
      email,
      restock,
      reason,
      staffNote,
    });

    res.status(200).send(job);
  } catch (error: any) {
    console.error('Error in GraphQL cancel:', error);
    res.status(500).send('Server error');
  }
}

/**
 * POST /api/cancel-fulfill/
 * Cancel a fulfillment
 */
export async function cancelFulfillment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await orderService.cancelFulfillment(req.body.fulId);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/order-update/
 * Update an order
 */
export async function updateOrder(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.updateOrder(req.body.input);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * GET /api/party-info/:id
 * Get party information by order ID
 */
export async function getPartyInfo(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.getPartyInfo(req.params.id);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/create-draft-order
 * Create a draft order
 */
export async function createDraftOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await orderService.createDraftOrder(req.body);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/update-draft-order
 * Update a draft order
 */
export async function updateDraftOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await orderService.updateDraftOrder({
      id: req.body.id,
      input: req.body.input,
    });
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/complete-order
 * Complete a draft order
 */
export async function completeOrder(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.completeDraftOrder(req.body.id);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/cancel
 * Create a refund (cancel line item)
 */
export async function cancel(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.createRefund({
      orderId: req.body.orderId,
      lineItemId: req.body.lineItemId,
    });
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/create-order
 * Create an order via REST API
 */
export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.createOrder(req.body);
    res.send(data);
  } catch (error: any) {
    console.error('Error creating order:', error.message);
    res.status(500).send({ message: error.message });
  }
}

/**
 * POST /api/order-note
 * Update order note
 */
export async function updateOrderNote(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { orderId, note } = req.body;

    if (!orderId || !note) {
      res.status(400).send('OrderId and note are required.');
      return;
    }

    const data = await orderService.updateOrderNote({ orderId, note });
    res.status(200).send(data);
  } catch (error: any) {
    console.error('Error updating order:', error);
    res.status(500).send('Server error');
  }
}

/**
 * GET /api/search-order/:orderId
 * Search order by ID with transactions
 */
export async function searchOrderById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await orderService.searchOrderById(req.params.orderId);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send({ message: error.message });
  }
}

/**
 * GET /api/get-fulfillment-orders/:orderId
 * Get fulfillment orders by order ID
 */
export async function getFulfillmentOrders(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = await orderService.getFulfillmentOrders(req.params.orderId);
    res.send(data);
  } catch (error: any) {
    console.error('Error: ', error.message);
    res.status(500).send({ message: error.message });
  }
}

/**
 * POST /api/batch-fulfill-orders/
 * Batch fulfill orders
 */
export async function batchFulfillOrders(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { fulfillmentOrderIds, notify, orderId } = req.body;
    const data = await orderService.batchFulfillOrders({
      fulfillmentOrderIds,
      notify,
      orderId,
    });
    res.send(data);
  } catch (error: any) {
    console.error('Error: ', error.message);
    res.status(500).send({ message: error.message });
  }
}

/**
 * GET /api/party-dates
 * Get party dates (available party room products)
 */
export async function getPartyDates(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.getPartyDates();
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * GET /api/party-times/:date
 * Get party times for a specific date
 */
export async function getPartyTimes(req: Request, res: Response): Promise<void> {
  try {
    const data = await orderService.getPartyTimes(req.params.date);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}
