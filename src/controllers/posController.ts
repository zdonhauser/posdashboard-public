/**
 * POS Controller
 * Handles HTTP requests for POS and PLU item operations
 */

import { Request, Response } from "express";
import * as posService from "../services/posService";

/**
 * Get PLU items
 */
export async function getPLUItems(req: Request, res: Response): Promise<void> {
  try {
    const groupNumber = req.query.group as string | undefined;
    const pluItems = await posService.getPLUItems(groupNumber);
    res.json(pluItems);
  } catch (error) {
    console.error("Error fetching products:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching products" });
  }
}

/**
 * Modify a PLU item
 */
export async function modifyPLUItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id, ...fieldsToUpdate } = req.body;
    const updatedItem = await posService.modifyPLUItem(id, fieldsToUpdate);
    res.json(updatedItem);
  } catch (error: any) {
    console.error("Error modifying PLU item:", error);
    if (error.message === "Missing PLU item ID") {
      res.status(400).json({ error: error.message });
    } else if (error.message === "No fields provided to update") {
      res.status(400).json({ error: error.message });
    } else if (error.message === "PLU item not found") {
      res.status(404).json({ error: error.message });
    } else {
      res
        .status(500)
        .json({ error: "An error occurred while modifying the PLU item" });
    }
  }
}

/**
 * Update PLU item color
 */
export async function updatePLUItemColor(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id, color } = req.body;
    const updatedItem = await posService.updatePLUItemColor(id, color);
    res.json(updatedItem);
  } catch (error: any) {
    console.error("Error updating plu item color:", error);
    if (error.message === "PLU item not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).send("Server error");
    }
  }
}

/**
 * Get POS tabs
 */
export async function getPOSByTab(req: Request, res: Response): Promise<void> {
  try {
    const { tab } = req.params;
    const posTabs = await posService.getPOSByTab(tab);
    res.json(posTabs);
  } catch (error) {
    console.error("Error fetching POS tabs:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching POS tabs" });
  }
}

/**
 * Create barcode
 */
export async function createBarcode(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { barcode, plu_id } = req.body;
    const newBarcode = await posService.createBarcode(barcode, plu_id);
    res.status(201).json(newBarcode);
  } catch (error: any) {
    console.error("Error creating barcode:", error);
    if (error.message === "Barcode and PLU ID are required.") {
      res.status(400).send(error.message);
    } else {
      res.status(500).send("Server error");
    }
  }
}

/**
 * Search by barcode
 */
export async function searchByBarcode(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { barcode } = req.params;
    const item = await posService.searchByBarcode(barcode);

    if (item) {
      res.json(item);
    } else {
      res.status(204).json();
    }
  } catch (error: any) {
    console.error("[DB] Database error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    if (error.message === "Barcode is required.") {
      res.status(400).send(error.message);
    } else {
      res.status(500).json({
        error: "An error occurred while searching",
        details: error.message,
        code: error.code,
      });
    }
  }
}

/**
 * Get POS mods
 */
export async function getPOSMods(req: Request, res: Response): Promise<void> {
  try {
    const { modclasses } = req.params as { modclasses: string };
    const groupedMods = await posService.getPOSMods(modclasses);
    res.json(groupedMods);
  } catch (error) {
    console.error("Error fetching pos mods:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching pos mods" });
  }
}

/**
 * Get mods
 */
export async function getMods(req: Request, res: Response): Promise<void> {
  try {
    const modClasses = req.query.modClasses as string;
    const mods = await posService.getMods(modClasses);
    res.json(mods);
  } catch (error: any) {
    console.error("Error fetching mods:", error);
    if (error.message === "Invalid or missing modClasses parameter") {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An error occurred while fetching mods" });
    }
  }
}
