/**
 * Media Controller
 * Handles HTTP requests for QR code and card image generation
 */

import { Request, Response } from "express";

/**
 * Generate QR code image
 * Requires qrGenerator to be injected via dependency injection
 */
export function createQRController(qrGenerator: any) {
  return async (req: Request, res: Response): Promise<void> => {
    const data = req.params.data;

    try {
      const imageBuffer = await qrGenerator.generate(data);
      res.setHeader("Content-Type", "image/jpg");
      res.setHeader("Content-Disposition", `inline; filename="${data}.jpg"`);
      res.end(imageBuffer);
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).send("Error generating QR code");
    }
  };
}

/**
 * Generate card/ticket image
 * Requires cardGenerator to be injected via dependency injection
 */
export function createCardController(cardGenerator: any) {
  return async (req: Request, res: Response): Promise<void> => {
    if (!cardGenerator) {
      console.error(
        "Card generator unavailable: canvas dependencies missing."
      );
      res.status(500).send("Error generating ticket image");
      return;
    }

    const cardType = decodeURIComponent(req.params.cardType);
    const data = decodeURIComponent(req.params.data);
    const type = decodeURIComponent(req.params.type).replace(/\+/g, " ");

    try {
      const buffer = await cardGenerator.generate({
        cardType,
        data,
        type,
      });
      res.setHeader("Content-Type", "image/png");
      res.end(buffer);
    } catch (error) {
      console.error("Error generating ticket image:", error);
      res.status(500).send("Error generating ticket image");
    }
  };
}
