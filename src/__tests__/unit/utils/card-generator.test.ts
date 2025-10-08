import { createCardGenerator } from "@utils/card-generator";

function createMockCanvas() {
  const operations: string[] = [];

  const context: Record<string, any> = {
    beginPath: jest.fn(() => operations.push("beginPath")),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    closePath: jest.fn(),
    fill: jest.fn(),
    save: jest.fn(),
    clip: jest.fn(),
    fillRect: jest.fn(),
    drawImage: jest.fn(() => operations.push("drawImage")),
    fillText: jest.fn((text: string) => operations.push(`text:${text}`)),
  };

  Object.defineProperty(context, "fillStyle", {
    set(value) {
      operations.push(`fillStyle:${value}`);
    },
  });

  Object.defineProperty(context, "textAlign", {
    set(value) {
      operations.push(`textAlign:${value}`);
    },
  });

  Object.defineProperty(context, "font", {
    set(value) {
      operations.push(`font:${value}`);
    },
  });

  const canvas = {
    getContext: jest.fn(() => context),
    toBuffer: jest.fn(() => Buffer.from("mock-buffer")),
  };

  return { canvas, context, operations };
}

describe("utils/card-generator", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders premium gift cards with bow asset and personalized text", async () => {
    const { canvas, context, operations } = createMockCanvas();
    const generateQrCodeBuffer = jest
      .fn()
      .mockResolvedValue(Buffer.from("qr"));
    const loadImage = jest
      .fn()
      .mockImplementation(async (src) => ({ src }));
    const resolveAssetPath = jest
      .fn()
      .mockImplementation((relative: string) => `/assets/${relative}`);

    const generator = createCardGenerator({
      createCanvas: jest.fn(() => canvas),
      loadImage,
      resolveAssetPath,
      generateQrCodeBuffer,
      getNow: () => new Date("2024-12-01"),
    });

    const buffer = await generator.generate({
      cardType: "gift",
      data: "ABC123",
      type: "Premium Membership name=Jordan",
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(generateQrCodeBuffer).toHaveBeenCalledWith(
      "ABC123",
      expect.objectContaining({ width: 200 })
    );
    expect(Buffer.isBuffer(loadImage.mock.calls[0][0])).toBe(true);
    expect(loadImage.mock.calls[1][0]).toBe("/assets/images/greenbow.png");
    expect(resolveAssetPath).toHaveBeenCalledWith("images/greenbow.png");
    expect(context.fillText).toHaveBeenCalledWith(
      "Premium Membership",
      expect.any(Number),
      350
    );
    expect(operations).toContain("text:Jordan");
  });

  it("renders membership cards without bow asset and uses wider QR codes", async () => {
    const { canvas, context } = createMockCanvas();
    const generateQrCodeBuffer = jest
      .fn()
      .mockResolvedValue(Buffer.from("qr"));
    const loadImage = jest
      .fn()
      .mockImplementation(async () => ({}));
    const resolveAssetPath = jest.fn();

    const generator = createCardGenerator({
      createCanvas: jest.fn(() => canvas),
      loadImage,
      resolveAssetPath,
      generateQrCodeBuffer,
      getNow: () => new Date("2025-02-01"),
    });

    await generator.generate({
      cardType: "membership",
      data: "XYZ789",
      type: "Unlimited Wristband name=Taylor",
    });

    expect(generateQrCodeBuffer).toHaveBeenCalledWith(
      "XYZ789",
      expect.objectContaining({ width: 250 })
    );
    expect(loadImage).toHaveBeenCalledTimes(1);
    expect(resolveAssetPath).not.toHaveBeenCalled();
    expect(context.fillText).toHaveBeenCalledWith(
      "Unlimited Wristband",
      expect.any(Number),
      350
    );
  });
});
