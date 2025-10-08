// globals.d.ts
export {};

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare global {
  interface Window {
    electronAPI: {
    getClockinOnlyMode(): boolean;
    clockinOnly(): boolean;
    printTimeclockReceipt(name: string, entries: any[]): unknown;
	  openDrawer(): unknown;
	  reprintLastOrder(): void;
	  getStoredDirectoryPath(): string;
	  readFileAsDataURL(filePath: string): string;
    writeFile(fileName: string, data: Buffer | string): void;
    printOrder(
      receiptContent: import("./components/POSWindow/POSTypes").ExtendedLineItem[],
      transactions: import("./components/POSWindow/POSTypes").Transaction[],
      orderNumber: number,
      orderId: number,
      totalTax: number,
      discountCodes: import("./components/POSWindow/POSTypes").DiscountCode[],
      subtotalPrice: number,
      totalPrice:number,
      customer: any
    ): unknown;
    printTicket(
      kdsOrder: import("./components/POSWindow/POSTypes").KDSOrder
    ): unknown;
    selectDirectory: () =>
      Promise<string>;
    // Declare other methods of electronAPI here as needed
    };
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}
