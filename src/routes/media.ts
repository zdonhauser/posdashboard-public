/**
 * Media Routes
 * Defines all media generation API endpoints (QR codes, cards/tickets)
 */

import { Router } from "express";
import { createQRController, createCardController } from "../controllers/mediaController";

/**
 * Create media routes with injected generators
 * This allows for dependency injection of QR and card generators
 *
 * @param qrGenerator QR code generator instance
 * @param cardGenerator Card/ticket generator instance (nullable for Electron)
 * @returns Express router with media routes
 */
export function createMediaRoutes(
  qrGenerator: any,
  cardGenerator: any = null
): Router {
  const router = Router();

  /**
   * @route   GET /qr/:data.jpg
   * @desc    Generate a QR code image
   * @access  Public (no JWT required)
   * @param   data - Data to encode in QR code
   */
  router.get("/qr/:data.jpg", createQRController(qrGenerator));

  /**
   * @route   GET /card/:cardType/:data/:type.png
   * @desc    Generate a card/ticket image
   * @access  Public (no JWT required)
   * @param   cardType - Type of card to generate
   * @param   data - Data to encode in card
   * @param   type - Card subtype
   */
  router.get("/card/:cardType/:data/:type.png", createCardController(cardGenerator));

  return router;
}

export default createMediaRoutes;
