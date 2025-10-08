/**
 * Server Entry Point
 * Main application server with environment-specific configuration
 */

import express from "express";
import bodyParser from "body-parser";
import path from "path";
import http from "http";
import fs from "fs";
import https from "https";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer } from "socket.io";

import { env, isElectron, isProduction } from "@config/environment";
import { initializeDatabase } from "@config/database";
import { registerWebhookRoutes } from "@routes/webhooks";
import { createQrGenerator } from "@utils/qr-generator";
import { createCardGenerator } from "@utils/card-generator";
import { createMediaRoutes } from "@routes/media";
import { initializeSocket } from "@config/socket";
import { registerRoutes } from "@routes/index";

// Dynamically require `canvas` only when not in Electron
let createCanvas: any, loadImage: any;

if (!process.versions.electron) {
  ({ createCanvas, loadImage } = require("canvas"));
}

const app = express();

// Initialize database connection
initializeDatabase();

// Register webhook routes (must be before bodyParser for raw body access)
registerWebhookRoutes(app, {
  enableShopifyOrderRoutes: !isElectron(),
});

// Configure media routes (QR codes and cards) for non-Electron environments
if (!isElectron()) {
  const qrGenerator = createQrGenerator();
  const resolveAssetPath = (relativePath: string) =>
    path.resolve(
      __dirname,
      isProduction()
        ? `../public/${relativePath}`
        : `./public/${relativePath}`
    );

  const cardGenerator =
    createCanvas && loadImage
      ? createCardGenerator({
          createCanvas,
          loadImage,
          resolveAssetPath,
          generateQrCodeBuffer: (data, options) =>
            qrGenerator.generate(data, options),
        })
      : null;

  // Register media routes
  const mediaRoutes = createMediaRoutes(qrGenerator, cardGenerator);
  app.use(mediaRoutes);
}

// Static file serving
app.use(express.static(path.join(__dirname, "client/build")));

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT authentication middleware for /api/ routes
app.use("/api/", (req, res, next) => {
  // Skip JWT for public auth routes
  if (
    req.path === "/validate-device" ||
    req.path === "/verify-passcode" ||
    (req.method === "GET" && req.path.match(/^\/employee\/[^/]+$/))
  ) {
    return next();
  }

  // Get the token from the header
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(403).send({ error: "No token provided." });
  }

  // Verify the token
  jwt.verify(
    token,
    process.env.JWT_SECRET || "default-jwt-secret",
    (err: any, decoded: any) => {
      if (err) {
        return res.status(401).send({ error: "Failed to authenticate token." });
      }
      // If successful, proceed to the next middleware
      next();
    }
  );
});

// Register all application routes
registerRoutes(app);

// Server setup based on environment
let server: any;
let io: SocketIOServer;

if (isProduction()) {
  // Production environment (Heroku)
  app.enable("trust proxy");

  // Force HTTPS redirect
  app.use((req, res, next) => {
    if (req.protocol !== "https") {
      return res.redirect("https://" + req.headers.host + req.url);
    }
    next();
  });

  // Serve static files from the React app's build folder
  app.use(express.static(path.join(__dirname, "..", "client", "build")));

  // Send all other requests to the React app's index.html file
  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
  });

  server = http.createServer(app);

  const productionPort = env.port === 3001 ? 8080 : env.port;

  server.listen(productionPort, async () => {
    console.log(`Production server running on port ${productionPort}`);
    io = await initializeSocket(server);
  });
} else if (isElectron()) {
  // Electron environment: Use self-signed certificates
  app.use(express.static(path.join(__dirname, "..", "client", "build")));
  console.log("device");

  const keyPath = path.join(__dirname, "..", "key.pem");
  const certPath = path.join(__dirname, "..", "cert.pem");

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  server = https.createServer(httpsOptions, app);

  console.log("electron port: ", process.env.ELECTRON_PORT);

  server.listen(process.env.ELECTRON_PORT || 8901, async () => {
    console.log(
      `Electron (local) server running with SSL on port ${
        process.env.ELECTRON_PORT || 8901
      }`
    );
    io = await initializeSocket(server);
  });
} else {
  // Development mode: Use ts-node to run TypeScript files directly
  console.log("running in dev mode");

  app.get("*", (_req, res) => {
    res.send("Development mode: no static files served.");
  });

  const keyPath = path.join(__dirname, "key.pem");
  const certPath = path.join(__dirname, "cert.pem");

  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  server = https.createServer(httpsOptions, app);

  server.listen(8080, async () => {
    console.log("HTTPS server running in development mode on port 8080");
    io = await initializeSocket(server);
  });
}
