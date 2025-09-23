# ZDT POS Dashboard

React-based web management interface for the ZDT Point of Sale system, providing real-time monitoring, reporting, inventory management, employee tracking, and system configuration. Built with Express backend and React frontend, featuring Socket.IO real-time updates.

## Architecture

### Backend (Express Server)
- **index.tsx** – Main Express server with TypeScript. Handles PostgreSQL database access, Shopify/Stripe integration, Socket.IO real-time notifications, and RESTful `/api/*` routes. Compiles to `dist/index.js`.
- **Socket.IO Server** – Real-time communication for KDS updates, order notifications, and live dashboard data
- **PostgreSQL Integration** – Direct database queries for orders, products, customers, employees, and reporting
- **External APIs** – Stripe payment processing, Shopify product sync, Google Drive photo storage

### Frontend (React Client)
- **client/** – React 18.2 application with TypeScript implementing the dashboard UI
- **Material-UI Components** – Modern interface with responsive design
- **Real-time Updates** – Socket.IO client for live data synchronization
- **Role-based Access** – Different interfaces for Front, Kitchen, and Manager roles

### Supporting Files
- **photoimport.py** – Python utility for bulk importing membership photos to PostgreSQL
- **membership-photos-*.json** – Google Service Account credentials for Drive API
- **Heroku Config** – `Aptfile`/`Procfile` for cloud deployment
- **dist/** – TypeScript compilation output

## Installation

### Prerequisites
- Node.js 18.16.1
- Yarn 1.22.19 (specified in engines)
- PostgreSQL database

### Setup Steps
1. **Install server dependencies:**
   ```bash
   yarn install
   ```

2. **Install client dependencies:**
   ```bash
   cd client && yarn install
   ```

3. **Database Setup:**
   - Ensure PostgreSQL is running
   - Create database and configure connection
   - Run any necessary migrations

## Environment Configuration

Copy `.env.example` to `.env` and configure all required variables:

### Core Configuration
```env
# Application
NODE_ENV=development
PORT=8080
ELECTRON_PORT=8901

# Database (PostgreSQL)
DB_HOST=your_database_host
DB_NAME=your_database_name  
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_PORT=5432

# Optional backup database
DB_HOST_BACKUP=backup_host
DB_PORT_BACKUP=5432
```

### Payment & E-commerce
```env
# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_ENDPOINT_SECRET=whsec_your_webhook_secret

# Shopify Integration
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_PASSWORD=shppa_your_private_app_password
SHOPIFY_TOKEN=shppa_your_access_token  
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
SHOP_NAME=your-shop-name
```

### Security
```env
# Authentication & Session Management
JWT_SECRET=your_jwt_secret_min_32_chars
SEAL_SECRET=seal_secret_session_encryption_key
SEAL_TOKEN=seal_token_session_token_key
```

**Important:** Never commit actual `.env` files to version control. All production secrets should be managed securely through your deployment platform.

## Development Commands

### Full Development (Recommended)
```bash
yarn start-all
```
Starts both Express server (`ts-node index.tsx`) and React dev server with hot reload.

### Individual Services
```bash
# Express server only (port 8080)
yarn start-dev

# React client only (port 3001)
yarn client-local

# For Electron integration
yarn app
```

### Development URLs
- **API Server**: http://localhost:8080
- **React Client**: http://localhost:3001
- **WebSocket**: Socket.IO on port 8080

## Production Build

### Complete Build
```bash
yarn build
```
Compiles TypeScript server to `dist/` and builds React client to `client/build/`.

### Individual Builds
```bash
# Server compilation only
yarn build-server

# Client build only  
yarn build-client
```

### Running Production
```bash
yarn start
```
Runs the compiled server from `dist/index.js`, serving the built client from `client/build/`.

## Dashboard Features

### Point of Sale Interfaces
- **Front Counter POS** – Full transaction interface with payment processing
- **Kitchen POS** – Simplified interface for kitchen staff
- **Kitchen Display System (KDS)** – Real-time order tracking with multiple modes (kitchen, pickup, recall)

### Management & Reporting  
- **Daily Reports** – Sales analytics, transaction summaries, performance metrics
- **Register Reports** – Individual register performance and reconciliation
- **Employee Management** – Staff profiles, permissions, hour tracking
- **Member Database** – Customer profiles with Google Drive photo integration
- **Gift Card System** – Card creation, activation, balance management

### Booking & Scheduling
- **Party Booking** – Event scheduling and management
- **Group Management** – Large party coordination
- **Employee Clock-in/out** – Time tracking with role-based access

### Technical Features
- **Real-time Updates** – Socket.IO for live order status, KDS updates
- **Role-based Access Control** – Front/Kitchen/Manager permission levels
- **Device Authentication** – Secure device registration and access control
- **Stripe Integration** – Payment processing, terminal management, webhook handling
- **Shopify Sync** – Product catalog synchronization, order fulfillment
- **Responsive Design** – Mobile-friendly interface for tablets and touch devices

## API Routes

All API endpoints follow the pattern `/api/[resource]/[action]`. Key endpoints include:

- Order management (`/api/orders/*`)
- Product operations (`/api/products/*`) 
- Customer management (`/api/customers/*`)
- Employee operations (`/api/employees/*`)
- Reporting endpoints (`/api/reports/*`)
- Gift card operations (`/api/giftcards/*`)
- Member management (`/api/members/*`)

Webhook endpoints:
- `/webhooks/stripe` – Stripe payment webhooks
- `/webhooks/shopify` – Shopify product/order webhooks

See `index.tsx` for complete API documentation and route definitions.

