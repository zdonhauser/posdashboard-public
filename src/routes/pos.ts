/**
 * POS Routes
 * Defines all POS and PLU-related API endpoints
 */

import { Router } from "express";
import * as posController from "../controllers/posController";

const router = Router();

/**
 * @route   GET /api/get-plu-items
 * @desc    Get PLU items, optionally filtered by group
 * @access  Protected (requires JWT authentication)
 * @query   group - Optional group number to filter by
 */
router.get("/get-plu-items", posController.getPLUItems);

/**
 * @route   PUT /api/modify-plu-item
 * @desc    Modify a PLU item
 * @access  Protected (requires JWT authentication)
 * @body    { id: string, ...fieldsToUpdate }
 */
router.put("/modify-plu-item", posController.modifyPLUItem);

/**
 * @route   PUT /api/update-plu-item-color/:id
 * @desc    Update PLU item color
 * @access  Protected (requires JWT authentication)
 * @body    { id: string, color: string }
 */
router.put("/update-plu-item-color/:id", posController.updatePLUItemColor);

/**
 * @route   GET /api/get-pos-by-tab/:tab?
 * @desc    Get POS tabs, optionally filtered by tab ID
 * @access  Protected (requires JWT authentication)
 * @params  tab - Optional tab ID to filter by
 */
router.get("/get-pos-by-tab/:tab?", posController.getPOSByTab);

/**
 * @route   POST /api/create-barcode
 * @desc    Create a new barcode
 * @access  Protected (requires JWT authentication)
 * @body    { barcode: string, plu_id: string }
 */
router.post("/create-barcode", posController.createBarcode);

/**
 * @route   GET /api/search-by-barcode/:barcode
 * @desc    Search for a PLU item by barcode
 * @access  Protected (requires JWT authentication)
 * @params  barcode - Barcode to search for
 */
router.get("/search-by-barcode/:barcode", posController.searchByBarcode);

/**
 * @route   GET /api/get-pos-mods/:modclasses
 * @desc    Get POS mods by mod classes
 * @access  Protected (requires JWT authentication)
 * @params  modclasses - Comma-separated list of mod classes
 */
router.get("/get-pos-mods/:modclasses", posController.getPOSMods);

/**
 * @route   GET /api/get-mods
 * @desc    Get mods by mod classes
 * @access  Protected (requires JWT authentication)
 * @query   modClasses - Comma-separated list of mod classes
 */
router.get("/get-mods", posController.getMods);

export default router;
