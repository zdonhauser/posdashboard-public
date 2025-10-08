import QRCode from "qrcode";

import {
  createQrGenerator,
  generateQrCodeBuffer,
} from "@utils/qr-generator";

describe("utils/qr-generator", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("generates a QR code buffer", async () => {
    const buffer = await generateQrCodeBuffer("hello-world");
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("caches repeated generations for identical inputs and options", async () => {
    const spy = jest.spyOn(QRCode, "toBuffer");
    const generator = createQrGenerator();

    await generator.generate("cached-data");
    await generator.generate("cached-data");
    await generator.generate("cached-data", { width: 250 });

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("throws when attempting to generate a QR code without data", async () => {
    await expect(generateQrCodeBuffer("")).rejects.toThrow(
      "QR code data is required."
    );
  });
});
