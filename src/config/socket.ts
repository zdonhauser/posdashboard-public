/**
 * Socket.IO Configuration
 *
 * Manages Socket.IO server setup and PostgreSQL notification listeners
 */

import { Server as SocketIOServer } from "socket.io";
import { PoolClient } from "pg";
import { pool } from "./database";

/**
 * Socket.IO Event Types
 */
export interface SocketEvents {
  // KDS Events
  kds_update: string;

  // Transaction Events
  transaction_update: string;
}

/**
 * PostgreSQL Notification Channels
 */
export enum NotificationChannel {
  KDS_ORDER_UPDATE = "kds_order_update",
  TRANSACTION_UPDATE = "transaction_update",
}

/**
 * Setup PostgreSQL notifications to emit Socket.IO events
 * Listens to database NOTIFY events and forwards them via Socket.IO
 *
 * @param io Socket.IO server instance
 */
export async function setupPostgresNotifications(
  io: SocketIOServer
): Promise<void> {
  try {
    const notificationClient: PoolClient = await pool.connect();
    // Do not release this client so it remains dedicated for notifications

    // Setup KDS order update listener
    try {
      await notificationClient.query(`LISTEN ${NotificationChannel.KDS_ORDER_UPDATE}`);
      console.log(`Now listening for ${NotificationChannel.KDS_ORDER_UPDATE} notifications.`);
    } catch (err) {
      console.error(`Error executing LISTEN ${NotificationChannel.KDS_ORDER_UPDATE} query:`, err);
    }

    // Setup transaction update listener
    try {
      await notificationClient.query(`LISTEN ${NotificationChannel.TRANSACTION_UPDATE}`);
      console.log(`Now listening for ${NotificationChannel.TRANSACTION_UPDATE} notifications.`);
    } catch (err) {
      console.error(`Error executing LISTEN ${NotificationChannel.TRANSACTION_UPDATE} query:`, err);
    }

    // Handle notifications
    notificationClient.on("notification", (msg) => {
      // Route notifications based on channel
      if (msg.channel === NotificationChannel.KDS_ORDER_UPDATE) {
        io.emit("kds_update", "kds needs to update");
      } else if (msg.channel === NotificationChannel.TRANSACTION_UPDATE) {
        io.emit("transaction_update", msg.payload || "transaction updated");
      }
    });

    notificationClient.on("error", (err) => {
      console.error("Notification client error:", err);
    });
  } catch (err) {
    console.error("Error obtaining a notification client from the pool:", err);
  }
}

/**
 * Create and configure Socket.IO server
 *
 * @param httpServer HTTP or HTTPS server instance
 * @param corsOrigin CORS origin (default: "*")
 * @returns Configured Socket.IO server
 */
export function createSocketServer(
  httpServer: any,
  corsOrigin: string = "*"
): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
    },
  });

  return io;
}

/**
 * Initialize Socket.IO with PostgreSQL notifications
 *
 * @param httpServer HTTP or HTTPS server instance
 * @param corsOrigin CORS origin (default: "*")
 * @returns Configured Socket.IO server with notifications setup
 */
export async function initializeSocket(
  httpServer: any,
  corsOrigin: string = "*"
): Promise<SocketIOServer> {
  const io = createSocketServer(httpServer, corsOrigin);
  await setupPostgresNotifications(io);
  return io;
}
