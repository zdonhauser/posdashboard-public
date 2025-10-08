/**
 * Shopify Controller
 * Handles Shopify-related HTTP requests and responses
 */

import { Request, Response } from 'express';
import * as shopifyService from '../services/shopifyService';

/**
 * Get subscription details from SEAL API
 * GET /api/get-subscription-details/:subId
 */
export async function getSubscriptionDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { subId } = req.params;
    const data = await shopifyService.getSubscriptionDetails(subId);
    res.send(data);
  } catch (error: any) {
    console.error('Error fetching subscription details:', error);
    res.status(500).send({ message: 'Error fetching subscription details' });
  }
}

/**
 * Get shop information
 * GET /api/shop-info
 */
export async function getShopInfo(req: Request, res: Response): Promise<void> {
  try {
    const data = await shopifyService.getShopInfo();
    res.send(data);
  } catch (error: any) {
    console.error('Error fetching shop info:', error.message);
    res.status(500).send({ error: error.message });
  }
}

/**
 * Search Shopify products
 * GET /api/shopify-products?q=search_term
 */
export async function searchProducts(req: Request, res: Response): Promise<void> {
  try {
    const searchQuery = req.query.q;

    if (!searchQuery || typeof searchQuery !== 'string') {
      res.status(400).json({ error: 'Missing or invalid search query.' });
      return;
    }

    const results = await shopifyService.searchProducts(searchQuery);
    res.status(200).json(results);
  } catch (error: any) {
    console.error('Shopify search failed:', error);
    res.status(500).json({ error: 'Failed to fetch products from Shopify.' });
  }
}

/**
 * Create a new Shopify product
 * POST /api/create-shopify-item
 */
export async function createShopifyItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { title, price, sku, vendor } = req.body;

    if (!title || typeof price !== 'number') {
      res.status(400).json({ error: 'Missing title or price' });
      return;
    }

    const result = await shopifyService.createShopifyItem(title, price, sku, vendor);
    res.json(result);
  } catch (error: any) {
    console.error('Error creating Shopify item:', error);
    res.status(500).json({ error: error.message || 'Failed to create Shopify product' });
  }
}

/**
 * Get metafields by namespace
 * GET /api/metafield/:namespace
 */
export async function getMetafields(req: Request, res: Response): Promise<void> {
  try {
    const { namespace } = req.params;
    const data = await shopifyService.getMetafields(namespace);
    res.send(data);
  } catch (error: any) {
    console.error('Error fetching metafields:', error.message);
    res.status(500).send({ error: error.message });
  }
}

/**
 * Search product variants by SKU
 * GET /api/search-variants/:sku
 */
export async function searchVariantsBySku(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { sku } = req.params;
    const data = await shopifyService.searchVariantsBySku(sku);
    res.send(data);
  } catch (error: any) {
    console.error('Error searching variants:', error.message);
    res.status(500).send({ error: error.message });
  }
}

/**
 * Search items by PLU number
 * GET /api/item-search/?term=plu
 */
export async function searchItems(req: Request, res: Response): Promise<void> {
  try {
    const term = req.query.term as string;

    if (!term) {
      res.status(400).json({ error: 'Missing search term' });
      return;
    }

    const data = await shopifyService.searchItems(term);
    res.send(data);
  } catch (error: any) {
    console.error('Error searching items:', error.message);
    res.status(500).send({ error: error.message });
  }
}

/**
 * Update inventory quantity
 * POST /api/update-inventory
 */
export async function updateInventory(req: Request, res: Response): Promise<void> {
  try {
    const { variantId, quantity } = req.body;

    if (!variantId || typeof quantity !== 'number') {
      res.status(400).json({ error: 'Missing variantId or quantity' });
      return;
    }

    const data = await shopifyService.updateInventory(variantId, quantity);
    res.send(data);
  } catch (error: any) {
    console.error('Error updating inventory:', error.message);
    res.status(500).send({ error: error.message });
  }
}

/**
 * Delete a product variant
 * POST /api/delete-variant
 */
export async function deleteVariant(req: Request, res: Response): Promise<void> {
  try {
    const { variantId } = req.body;

    if (!variantId) {
      res.status(400).json({ error: 'Missing variantId' });
      return;
    }

    const data = await shopifyService.deleteVariant(variantId);

    if (data.errors) {
      console.log(data.errors);
      res.status(400).json({
        message: 'Failed to delete product variant.',
        errors: data.errors,
      });
      return;
    }

    res.status(200).json({
      message: 'Product variant successfully deleted.',
      data: data.data,
    });
  } catch (error: any) {
    console.error('Error deleting variant:', error.message);
    res.status(500).json({
      message: 'An error occurred while deleting the product variant.',
    });
  }
}

/**
 * Delete a product
 * POST /api/delete-product
 */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { productId } = req.body;

    if (!productId) {
      res.status(400).json({ error: 'Missing productId' });
      return;
    }

    const data = await shopifyService.deleteProduct(productId);

    if (data.errors) {
      console.log(data.errors);
      res.status(400).json({
        message: 'Failed to delete product.',
        errors: data.errors,
      });
      return;
    }

    res.status(200).json({
      message: 'Product successfully deleted.',
      data: data.data,
    });
  } catch (error: any) {
    console.error('Error deleting product:', error.message);
    res.status(500).json({
      message: 'An error occurred while deleting the product.',
    });
  }
}

/**
 * Fetch products by collection
 * POST /api/product-fetch-by-collection
 */
export async function fetchProductsByCollection(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { collection } = req.body;

    if (!collection) {
      res.status(400).json({ error: 'Missing collection' });
      return;
    }

    const variants = await shopifyService.fetchProductsByCollection(collection);
    res.send(variants);
  } catch (error: any) {
    console.error('Error fetching products by collection:', error);
    res.status(500).send({ error: error.message });
  }
}

/**
 * Adjust inventory (delta adjustment)
 * POST /api/adjust-inventory
 */
export async function adjustInventory(req: Request, res: Response): Promise<void> {
  try {
    const { variantId, adjustment } = req.body;

    if (!variantId || typeof adjustment !== 'number') {
      res.status(400).json({ error: 'Missing variantId or adjustment' });
      return;
    }

    const data = await shopifyService.adjustInventory(variantId, adjustment);
    res.send(data);
  } catch (error: any) {
    console.error('Failed to adjust inventory:', error.message);
    res.status(500).send({ message: error.message });
  }
}
