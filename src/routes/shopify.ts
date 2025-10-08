/**
 * Shopify Routes
 * Defines all Shopify-related API endpoints
 */

import { Router } from 'express';
import * as shopifyController from '../controllers/shopifyController';

const router = Router();

/**
 * @route   GET /api/get-subscription-details/:subId
 * @desc    Get subscription details from SEAL API
 * @access  Protected (requires JWT authentication)
 * @params  subId - Subscription ID
 */
router.get(
  '/get-subscription-details/:subId',
  shopifyController.getSubscriptionDetails
);

/**
 * @route   GET /api/shop-info
 * @desc    Get shop information from Shopify
 * @access  Protected (requires JWT authentication)
 */
router.get('/shop-info', shopifyController.getShopInfo);

/**
 * @route   GET /api/shopify-products
 * @desc    Search Shopify products by query
 * @access  Protected (requires JWT authentication)
 * @query   q - Search query string
 */
router.get('/shopify-products', shopifyController.searchProducts);

/**
 * @route   POST /api/create-shopify-item
 * @desc    Create a new Shopify product
 * @access  Protected (requires JWT authentication)
 * @body    { title: string, price: number, sku?: string, vendor?: string }
 */
router.post('/create-shopify-item', shopifyController.createShopifyItem);

/**
 * @route   GET /api/metafield/:namespace
 * @desc    Get metafields by namespace
 * @access  Protected (requires JWT authentication)
 * @params  namespace - Metafield namespace
 */
router.get('/metafield/:namespace', shopifyController.getMetafields);

/**
 * @route   GET /api/search-variants/:sku
 * @desc    Search product variants by SKU
 * @access  Protected (requires JWT authentication)
 * @params  sku - SKU to search for
 */
router.get('/search-variants/:sku', shopifyController.searchVariantsBySku);

/**
 * @route   GET /api/item-search/
 * @desc    Search items by PLU number
 * @access  Protected (requires JWT authentication)
 * @query   term - PLU number to search
 */
router.get('/item-search/', shopifyController.searchItems);

/**
 * @route   POST /api/update-inventory
 * @desc    Update inventory quantity (set to specific value)
 * @access  Protected (requires JWT authentication)
 * @body    { variantId: string, quantity: number }
 */
router.post('/update-inventory', shopifyController.updateInventory);

/**
 * @route   POST /api/delete-variant
 * @desc    Delete a product variant
 * @access  Protected (requires JWT authentication)
 * @body    { variantId: string }
 */
router.post('/delete-variant', shopifyController.deleteVariant);

/**
 * @route   POST /api/delete-product
 * @desc    Delete a product
 * @access  Protected (requires JWT authentication)
 * @body    { productId: string }
 */
router.post('/delete-product', shopifyController.deleteProduct);

/**
 * @route   POST /api/product-fetch-by-collection
 * @desc    Fetch products by collection
 * @access  Protected (requires JWT authentication)
 * @body    { collection: string }
 */
router.post(
  '/product-fetch-by-collection',
  shopifyController.fetchProductsByCollection
);

/**
 * @route   POST /api/adjust-inventory
 * @desc    Adjust inventory (delta adjustment)
 * @access  Protected (requires JWT authentication)
 * @body    { variantId: string, adjustment: number }
 */
router.post('/adjust-inventory', shopifyController.adjustInventory);

export default router;
