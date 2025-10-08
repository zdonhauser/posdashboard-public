/**
 * Unit tests for Transaction Service
 */

import * as transactionService from "../../../services/transactionService";
import { queryDB } from "../../../config/database";

// Mock database
jest.mock("../../../config/database");
const mockQueryDB = queryDB as jest.MockedFunction<typeof queryDB>;

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("Transaction Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchTransactions", () => {
    it("should fetch transactions with pagination", async () => {
      const mockPage1 = {
        data: {
          orders: {
            edges: [
              {
                cursor: "cursor1",
                node: {
                  id: "order1",
                  email: "test@example.com",
                  createdAt: "2024-01-01",
                  transactions: [
                    {
                      amountSet: {
                        presentmentMoney: { amount: "10.00", currencyCode: "USD" },
                      },
                      gateway: "stripe",
                      status: "success",
                      kind: "sale",
                    },
                  ],
                },
              },
            ],
            pageInfo: { hasNextPage: false },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPage1,
      } as Response);

      const result = await transactionService.fetchTransactions(
        ["test@example.com"],
        "2024-01-01",
        "2024-01-31"
      );

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("test@example.com");
      expect(result[0].orderId).toBe("order1");
    });

    it("should handle multiple pages", async () => {
      const mockPage1 = {
        data: {
          orders: {
            edges: [
              {
                cursor: "cursor1",
                node: {
                  id: "order1",
                  email: "test@example.com",
                  createdAt: "2024-01-01",
                  transactions: [{ kind: "sale" }],
                },
              },
            ],
            pageInfo: { hasNextPage: true },
          },
        },
      };

      const mockPage2 = {
        data: {
          orders: {
            edges: [
              {
                cursor: "cursor2",
                node: {
                  id: "order2",
                  email: "test@example.com",
                  createdAt: "2024-01-02",
                  transactions: [{ kind: "sale" }],
                },
              },
            ],
            pageInfo: { hasNextPage: false },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockPage1 } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => mockPage2 } as Response);

      const result = await transactionService.fetchTransactions(["test@example.com"]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it("should throw error on GraphQL errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: "GraphQL error" }] }),
      } as Response);

      await expect(
        transactionService.fetchTransactions(["test@example.com"])
      ).rejects.toThrow();
    });
  });

  describe("getUnsettledTransactions", () => {
    it("should get unsettled transactions", async () => {
      const mockRows = [
        { id: 1, amount: 100, kind: "capture" },
        { id: 2, amount: 50, kind: "refund" },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await transactionService.getUnsettledTransactions();

      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe(100);
      expect(result[1].amount).toBe(-50); // Refund should be negative
    });

    it("should make change amounts negative", async () => {
      const mockRows = [{ id: 1, amount: 25, kind: "change" }];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await transactionService.getUnsettledTransactions();

      expect(result[0].amount).toBe(-25);
    });
  });

  describe("getUnsettledItems", () => {
    it("should get unsettled line items", async () => {
      const mockRows = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await transactionService.getUnsettledItems();

      expect(result).toEqual(mockRows);
    });
  });

  describe("settleTransactions", () => {
    it("should settle transactions by ID", async () => {
      const mockRows = [{ id: 1, settled_on: new Date() }];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await transactionService.settleTransactions(["1", "2"]);

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE transactions"),
        expect.arrayContaining([expect.any(Date), ["1", "2"]])
      );
      expect(result).toEqual(mockRows);
    });

    it("should return empty array when no IDs provided", async () => {
      const result = await transactionService.settleTransactions([]);

      expect(mockQueryDB).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("settleItems", () => {
    it("should settle line items by ID", async () => {
      const mockRows = [{ id: 1, settled_on: new Date() }];

      mockQueryDB.mockResolvedValueOnce({ rows: mockRows } as any);

      const result = await transactionService.settleItems(["1", "2"]);

      expect(mockQueryDB).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE line_item_sales"),
        expect.arrayContaining([expect.any(Date), ["1", "2"]])
      );
      expect(result).toEqual(mockRows);
    });

    it("should return empty array when no IDs provided", async () => {
      const result = await transactionService.settleItems([]);

      expect(mockQueryDB).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("fetchTenderTransactionsPost", () => {
    it("should fetch tender transactions with cursor", async () => {
      const mockData = {
        data: {
          tenderTransactions: {
            edges: [
              {
                cursor: "cursor1",
                node: { id: "t1", processedAt: "2024-01-01", amount: { amount: "10.00" } },
              },
            ],
            pageInfo: { hasNextPage: false },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await transactionService.fetchTenderTransactionsPost(
        "2024-01-01",
        "2024-01-31",
        50,
        "cursor1"
      );

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("unstable/graphql.json"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-Shopify-Access-Token": expect.any(String),
          }),
        })
      );
    });
  });

  describe("fetchTenderTransactionsGet", () => {
    it("should fetch tender transactions without reverse", async () => {
      const mockData = {
        data: {
          tenderTransactions: {
            edges: [],
            pageInfo: { hasNextPage: false },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await transactionService.fetchTenderTransactionsGet(
        "2024-01-01",
        "2024-01-31",
        50
      );

      expect(result).toEqual(mockData);
    });
  });

  describe("fetchTenderCount", () => {
    it("should fetch tender count successfully", async () => {
      const mockData = {
        data: {
          tenderTransactions: {
            edges: [
              {
                node: { id: "t1", processedAt: "2024-01-01", amount: { amount: "10.00" } },
                cursor: "cursor1",
              },
            ],
            pageInfo: { hasNextPage: false },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await transactionService.fetchTenderCount(
        "2024-01-01",
        "2024-01-31",
        50
      );

      expect(result).toEqual(mockData);
    });

    it("should retry on throttle error", async () => {
      const throttleError = {
        errors: [{ extensions: { code: "THROTTLED" } }],
        extensions: {
          cost: {
            requestedQueryCost: 100,
            throttleStatus: {
              currentlyAvailable: 50,
              restoreRate: 50,
            },
          },
        },
      };

      const successData = {
        data: {
          tenderTransactions: {
            edges: [],
            pageInfo: { hasNextPage: false },
          },
        },
      };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => throttleError } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => successData } as Response);

      const result = await transactionService.fetchTenderCount(
        "2024-01-01",
        "2024-01-31",
        50
      );

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(successData);
    });
  });
});
