import type { QRCodeToBufferOptions } from "qrcode";

import { generateQrCodeBuffer } from "./qr-generator";

export interface CardGeneratorDependencies {
  createCanvas: (width: number, height: number) => {
    getContext: (type: "2d") => any;
    toBuffer: (mimeType: string) => Buffer;
  };
  loadImage: (src: string | Buffer) => Promise<any>;
  resolveAssetPath: (relativePath: string) => string;
  generateQrCodeBuffer?: (
    data: string,
    options?: QRCodeToBufferOptions
  ) => Promise<Buffer>;
  getNow?: () => Date;
}

export interface CardGenerationInput {
  cardType: string;
  data: string;
  type: string;
}

export interface CardGenerator {
  generate(input: CardGenerationInput): Promise<Buffer>;
}

const CARD_WIDTH = 676;
const CARD_HEIGHT = 426;
const BORDER_RADIUS = 40;
const BORDER_WIDTH = 5;

export function createCardGenerator({
  createCanvas,
  loadImage,
  resolveAssetPath,
  generateQrCodeBuffer: qrBufferGenerator = generateQrCodeBuffer,
  getNow = () => new Date(),
}: CardGeneratorDependencies): CardGenerator {
  if (!createCanvas) {
    throw new Error("createCanvas dependency is required.");
  }

  if (!loadImage) {
    throw new Error("loadImage dependency is required.");
  }

  if (!resolveAssetPath) {
    throw new Error("resolveAssetPath dependency is required.");
  }

  return {
    async generate({ cardType, data, type }: CardGenerationInput): Promise<Buffer> {
      if (!cardType || !data) {
        throw new Error("cardType and data are required.");
      }

      const lowerCardType = cardType.toLowerCase();
      const sanitizedType = type ?? "";
      const lowerType = sanitizedType.toLowerCase();
      const name = sanitizedType.split("name=")[1] ?? null;

      const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
      const ctx = canvas.getContext("2d");

      // Outer border
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.moveTo(BORDER_RADIUS, 0);
      ctx.lineTo(CARD_WIDTH - BORDER_RADIUS, 0);
      ctx.quadraticCurveTo(CARD_WIDTH, 0, CARD_WIDTH, BORDER_RADIUS);
      ctx.lineTo(CARD_WIDTH, CARD_HEIGHT - BORDER_RADIUS);
      ctx.quadraticCurveTo(CARD_WIDTH, CARD_HEIGHT, CARD_WIDTH - BORDER_RADIUS, CARD_HEIGHT);
      ctx.lineTo(BORDER_RADIUS, CARD_HEIGHT);
      ctx.quadraticCurveTo(0, CARD_HEIGHT, 0, CARD_HEIGHT - BORDER_RADIUS);
      ctx.lineTo(0, BORDER_RADIUS);
      ctx.quadraticCurveTo(0, 0, BORDER_RADIUS, 0);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(BORDER_WIDTH + BORDER_RADIUS, BORDER_WIDTH);
      ctx.lineTo(CARD_WIDTH - BORDER_WIDTH - BORDER_RADIUS, BORDER_WIDTH);
      ctx.quadraticCurveTo(
        CARD_WIDTH - BORDER_WIDTH,
        BORDER_WIDTH,
        CARD_WIDTH - BORDER_WIDTH,
        BORDER_WIDTH + BORDER_RADIUS
      );
      ctx.lineTo(CARD_WIDTH - BORDER_WIDTH, CARD_HEIGHT - BORDER_WIDTH - BORDER_RADIUS);
      ctx.quadraticCurveTo(
        CARD_WIDTH - BORDER_WIDTH,
        CARD_HEIGHT - BORDER_WIDTH,
        CARD_WIDTH - BORDER_WIDTH - BORDER_RADIUS,
        CARD_HEIGHT - BORDER_WIDTH
      );
      ctx.lineTo(BORDER_WIDTH + BORDER_RADIUS, CARD_HEIGHT - BORDER_WIDTH);
      ctx.quadraticCurveTo(
        BORDER_WIDTH,
        CARD_HEIGHT - BORDER_WIDTH,
        BORDER_WIDTH,
        CARD_HEIGHT - BORDER_WIDTH - BORDER_RADIUS
      );
      ctx.lineTo(BORDER_WIDTH, BORDER_WIDTH + BORDER_RADIUS);
      ctx.quadraticCurveTo(
        BORDER_WIDTH,
        BORDER_WIDTH,
        BORDER_WIDTH + BORDER_RADIUS,
        BORDER_WIDTH
      );
      ctx.closePath();
      ctx.clip();

      let backgroundColor = "#FFFFFF";
      let text = "";

      if (lowerType.includes("premium")) {
        backgroundColor = "#FF0000";
        text = "Premium Membership";
      } else if (lowerType.includes("basic")) {
        backgroundColor = "#008000";
        text = "Basic Membership";
      } else if (
        lowerType.includes("combo meal") ||
        lowerType.includes("eat & play")
      ) {
        backgroundColor = "#FFFF00";
        text = "Eat & Play Combo";
      } else if (lowerType.includes("unlimited")) {
        backgroundColor = "#87CEEB";
        text = "Unlimited Wristband";
      }

      ctx.fillStyle = backgroundColor;
      ctx.fillRect(
        BORDER_WIDTH,
        BORDER_WIDTH,
        CARD_WIDTH - 2 * BORDER_WIDTH,
        CARD_HEIGHT - 2 * BORDER_WIDTH
      );

      const qrSize = lowerCardType === "gift" ? 200 : 250;
      const qrCodeBuffer = await qrBufferGenerator(data, {
        width: qrSize,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#00000000",
        },
        errorCorrectionLevel: "H",
      });

      const qrImage = await loadImage(qrCodeBuffer);
      const qrX = (CARD_WIDTH - qrSize) / 2;
      const qrY = lowerCardType === "gift" ? 100 : 50;
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

      if (lowerCardType === "gift") {
        const bowPath = resolveAssetPath(
          lowerType.includes("premium")
            ? "images/greenbow.png"
            : "images/bow.png"
        );
        const bow = await loadImage(bowPath);
        const bowWidth = 676;
        const bowHeight = 250;
        const bowX = (CARD_WIDTH - bowWidth) / 2;
        const bowY = -10;
        ctx.drawImage(bow, bowX, bowY, bowWidth, bowHeight);
      }

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.font = "bold 60px Helvetica, sans-serif";
      ctx.fillText(text, CARD_WIDTH / 2, 350);

      const now = getNow();

      if (
        lowerType.includes("12/25/2024") &&
        now < new Date("2024-12-25")
      ) {
        ctx.font = "20px Helvetica, sans-serif";
        ctx.fillText(
          "Valid for Redemption After 12/25/2024",
          CARD_WIDTH / 2,
          370
        );
        ctx.font = "20px Helvetica, sans-serif";
        ctx.fillText("ZDT's Amusement Park", CARD_WIDTH / 2, 390);
      } else if (name) {
        if (
          lowerType.includes("january 1") &&
          now < new Date("2025-01-01")
        ) {
          ctx.font = "20px Helvetica, sans-serif";
          ctx.fillText(
            `${name} - Valid for Use Starting January 1, 2025`,
            CARD_WIDTH / 2,
            370
          );
          ctx.font = "20px Helvetica, sans-serif";
          ctx.fillText("ZDT's Amusement Park", CARD_WIDTH / 2, 390);
        } else {
          ctx.font = "20px Helvetica, sans-serif";
          ctx.fillText(name, CARD_WIDTH / 2, 370);
          ctx.font = "20px Helvetica, sans-serif";
          ctx.fillText("ZDT's Amusement Park", CARD_WIDTH / 2, 390);
        }
      } else {
        ctx.font = "40px Helvetica, sans-serif";
        ctx.fillText("ZDT's Amusement Park", CARD_WIDTH / 2, 390);
      }

      ctx.font = "20px Helvetica, sans-serif";
      ctx.fillText(data, CARD_WIDTH / 2, 410);

      return canvas.toBuffer("image/png");
    },
  };
}
