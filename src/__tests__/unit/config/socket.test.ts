/**
 * Socket.IO Configuration Tests
 */

import { Server as SocketIOServer } from "socket.io";
import {
  setupPostgresNotifications,
  createSocketServer,
  initializeSocket,
  NotificationChannel,
} from "../../../config/socket";
import { pool } from "../../../config/database";
import { PoolClient } from "pg";

// Mock database
jest.mock("../../../config/database");
const mockPool = pool as jest.Mocked<typeof pool>;

describe("Socket.IO Configuration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("NotificationChannel enum", () => {
    it("should have correct channel names", () => {
      expect(NotificationChannel.KDS_ORDER_UPDATE).toBe("kds_order_update");
      expect(NotificationChannel.TRANSACTION_UPDATE).toBe("transaction_update");
    });
  });

  describe("createSocketServer", () => {
    it("should create Socket.IO server with default CORS", () => {
      const mockHttpServer = {};
      const io = createSocketServer(mockHttpServer);

      expect(io).toBeInstanceOf(SocketIOServer);
    });

    it("should create Socket.IO server with custom CORS", () => {
      const mockHttpServer = {};
      const io = createSocketServer(mockHttpServer, "https://example.com");

      expect(io).toBeInstanceOf(SocketIOServer);
    });
  });

  describe("setupPostgresNotifications", () => {
    let mockClient: any;
    let mockIo: Partial<SocketIOServer>;
    let notificationHandlers: Map<string, (msg: any) => void>;
    let errorHandlers: ((err: Error) => void)[];

    beforeEach(() => {
      notificationHandlers = new Map();
      errorHandlers = [];

      mockClient = {
        query: jest.fn().mockResolvedValue({}),
        on: jest.fn((event: string, handler: any) => {
          if (event === "notification") {
            notificationHandlers.set(event, handler);
          } else if (event === "error") {
            errorHandlers.push(handler);
          }
          return mockClient; // Return self for chaining
        }),
      };

      mockIo = {
        emit: jest.fn(),
      };

      mockPool.connect = jest.fn().mockResolvedValue(mockClient as PoolClient);
    });

    it("should setup PostgreSQL LISTEN for both channels", async () => {
      await setupPostgresNotifications(mockIo as SocketIOServer);

      expect(mockClient.query).toHaveBeenCalledWith("LISTEN kds_order_update");
      expect(mockClient.query).toHaveBeenCalledWith("LISTEN transaction_update");
      expect(console.log).toHaveBeenCalledWith(
        "Now listening for kds_order_update notifications."
      );
      expect(console.log).toHaveBeenCalledWith(
        "Now listening for transaction_update notifications."
      );
    });

    it("should emit kds_update event on kds_order_update notification", async () => {
      await setupPostgresNotifications(mockIo as SocketIOServer);

      const notificationHandler = notificationHandlers.get("notification");
      expect(notificationHandler).toBeDefined();

      notificationHandler!({ channel: "kds_order_update", payload: null });

      expect(mockIo.emit).toHaveBeenCalledWith("kds_update", "kds needs to update");
    });

    it("should emit transaction_update event with payload", async () => {
      await setupPostgresNotifications(mockIo as SocketIOServer);

      const notificationHandler = notificationHandlers.get("notification");
      expect(notificationHandler).toBeDefined();

      notificationHandler!({
        channel: "transaction_update",
        payload: "transaction-123",
      });

      expect(mockIo.emit).toHaveBeenCalledWith(
        "transaction_update",
        "transaction-123"
      );
    });

    it("should use default message if payload is missing", async () => {
      await setupPostgresNotifications(mockIo as SocketIOServer);

      const notificationHandler = notificationHandlers.get("notification");
      notificationHandler!({
        channel: "transaction_update",
        payload: null,
      });

      expect(mockIo.emit).toHaveBeenCalledWith(
        "transaction_update",
        "transaction updated"
      );
    });

    it("should handle errors during LISTEN setup", async () => {
      const mockError = new Error("LISTEN failed");
      mockClient.query = jest.fn().mockRejectedValue(mockError);

      await setupPostgresNotifications(mockIo as SocketIOServer);

      expect(console.error).toHaveBeenCalledWith(
        "Error executing LISTEN kds_order_update query:",
        mockError
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error executing LISTEN transaction_update query:",
        mockError
      );
    });

    it("should handle notification client errors", async () => {
      await setupPostgresNotifications(mockIo as SocketIOServer);

      expect(errorHandlers.length).toBeGreaterThan(0);
      const errorHandler = errorHandlers[0];

      const testError = new Error("Client connection lost");
      errorHandler(testError);

      expect(console.error).toHaveBeenCalledWith(
        "Notification client error:",
        testError
      );
    });

    it("should handle pool connection errors", async () => {
      const poolError = new Error("Pool exhausted");
      mockPool.connect = jest.fn().mockRejectedValue(poolError);

      await setupPostgresNotifications(mockIo as SocketIOServer);

      expect(console.error).toHaveBeenCalledWith(
        "Error obtaining a notification client from the pool:",
        poolError
      );
    });
  });

  describe("initializeSocket", () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        query: jest.fn().mockResolvedValue({}),
        on: jest.fn().mockReturnValue(mockClient),
      };

      mockPool.connect = jest.fn().mockResolvedValue(mockClient as PoolClient);
    });

    it("should create Socket.IO server and setup notifications", async () => {
      const mockHttpServer = {};
      const io = await initializeSocket(mockHttpServer);

      expect(io).toBeInstanceOf(SocketIOServer);
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith("LISTEN kds_order_update");
      expect(mockClient.query).toHaveBeenCalledWith("LISTEN transaction_update");
    });

    it("should use custom CORS origin", async () => {
      const mockHttpServer = {};
      const io = await initializeSocket(
        mockHttpServer,
        "https://custom-origin.com"
      );

      expect(io).toBeInstanceOf(SocketIOServer);
    });
  });
});
