import QRCode from "qrcode";
import type { QRCodeToBufferOptions } from "qrcode";

const DEFAULT_QR_OPTIONS: QRCodeToBufferOptions = {
  width: 194,
  margin: 1,
};

export type CachedQrGenerator = ReturnType<typeof createQrGenerator>;

function normalizeOptions(
  options: QRCodeToBufferOptions = {}
): QRCodeToBufferOptions {
  const resolved: QRCodeToBufferOptions = {
    ...DEFAULT_QR_OPTIONS,
    ...options,
  };

  if (!resolved.type) {
    resolved.type = "png";
  }

  return resolved;
}

function cacheKeyFor(data: string, options: QRCodeToBufferOptions): string {
  return JSON.stringify({ data, options });
}

export async function generateQrCodeBuffer(
  data: string,
  options?: QRCodeToBufferOptions
): Promise<Buffer> {
  if (!data) {
    throw new Error("QR code data is required.");
  }

  const resolved = normalizeOptions(options);
  return QRCode.toBuffer(data, resolved);
}

export function createQrGenerator(defaultOptions?: QRCodeToBufferOptions) {
  const cache = new Map<string, Buffer>();

  return {
    async generate(
      data: string,
      options?: QRCodeToBufferOptions
    ): Promise<Buffer> {
      const merged = normalizeOptions({
        ...defaultOptions,
        ...options,
      });
      const key = cacheKeyFor(data, merged);

      if (cache.has(key)) {
        return cache.get(key)!;
      }

      const buffer = await generateQrCodeBuffer(data, merged);
      cache.set(key, buffer);
      return buffer;
    },
    clearCache(): void {
      cache.clear();
    },
    getCacheSize(): number {
      return cache.size;
    },
  };
}

export const __testing = {
  normalizeOptions,
  cacheKeyFor,
};
