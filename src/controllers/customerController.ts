/**
 * Customer Controller
 * Handles HTTP requests for customer operations
 */

import { Request, Response } from 'express';
import * as customerService from '../services/customerService';

/**
 * POST /api/search-customers
 * Search customers by query
 */
export async function searchCustomers(req: Request, res: Response): Promise<void> {
  try {
    const query = req.body.query;
    const data = await customerService.searchCustomers(query);
    res.send(data);
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
}

/**
 * POST /api/customer
 * Create a new Shopify customer
 */
export async function createCustomer(req: Request, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({
        message: 'Missing required fields: firstName, lastName, and email are needed.',
      });
      return;
    }

    const result = await customerService.createCustomer({
      firstName,
      lastName,
      email,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating Shopify customer:', error);

    // Check if it's a user error from Shopify
    if (error.message.includes('errors')) {
      try {
        const errorData = JSON.parse(error.message);
        res.status(400).json(errorData);
        return;
      } catch {}
    }

    res.status(500).send('An error occurred while creating the Shopify customer.');
  }
}

/**
 * GET /api/customers/:query
 * Get customers by query using GraphQL
 */
export async function getCustomers(req: Request, res: Response): Promise<void> {
  try {
    const data = await customerService.getCustomers(req.params.query);
    res.send(data);
  } catch (error: any) {
    console.error('Error fetching customers:', error.message);
    res.status(500).send('An error occurred while fetching customer data.');
  }
}

/**
 * GET /api/customers/:identifier/store-credit
 * Get customer store credit by identifier (ID or email)
 */
export async function getCustomerStoreCredit(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const identifier = req.params.identifier;
    const data = await customerService.getCustomerStoreCredit(identifier);
    res.send(data);
  } catch (error: any) {
    console.error('Error fetching store credit:', error.message);

    if (error.message.includes('Invalid identifier')) {
      res.status(400).send(error.message);
      return;
    }

    if (error.message.includes('No customer found')) {
      res.status(404).send(error.message);
      return;
    }

    res.status(500).send('Error fetching store credit.');
  }
}

/**
 * PUT /api/customers/:id/store-credit
 * Update customer store credit (credit or debit)
 */
export async function updateCustomerStoreCredit(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { amount, currencyCode, type } = req.body;
    const id = req.params.id;

    const result = await customerService.updateCustomerStoreCredit({
      id,
      amount,
      currencyCode,
      type,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error updating store credit:', error.message);

    // Check if it's user errors from Shopify
    if (error.message.startsWith('[')) {
      try {
        const userErrors = JSON.parse(error.message);
        res.status(400).json(userErrors);
        return;
      } catch {}
    }

    res.status(500).send('Error updating store credit.');
  }
}
