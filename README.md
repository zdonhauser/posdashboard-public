# ZDT POS Dashboard

React-based web management interface for the ZDT Point of Sale system, providing real-time monitoring, reporting, inventory management, employee tracking, and system configuration. Built with Express backend and React frontend, featuring Socket.IO real-time updates.

## Architecture

### Backend (Express Server)

The backend follows a modular architecture with clear separation of concerns:

**Entry Point:**
- **server.ts** – Main Express server with environment-specific configuration (production, electron, development)

**Core Modules:**
- **src/config/** – Configuration modules (database, Stripe, Shopify, Google Drive, Socket.IO, environment)
- **src/routes/** – Route definitions organized by domain (employees, orders, products, etc.)
- **src/controllers/** – Request handlers for each domain
- **src/services/** – Business logic and data operations
- **src/middleware/** – Express middleware (authentication, error handling)
- **src/utils/** – Utility functions (locks, QR generation, auth helpers)
- **src/types/** – TypeScript type definitions

**Key Features:**
- PostgreSQL database with connection pooling
- Socket.IO real-time notifications
- JWT-based authentication
- RESTful API endpoints
- Stripe payment processing
- Shopify product synchronization
- Google Drive photo storage

### Frontend (React Client)

- **client/** – React 18.2 application with TypeScript
- **Material-UI Components** – Modern responsive interface
- **Real-time Updates** – Socket.IO client for live data
- **Role-based Access** – Front, Kitchen, and Manager interfaces

### Supporting Files

- **photoimport.py** – Python utility for bulk importing membership photos
- **membership-photos-*.json** – Google Service Account credentials for Drive API
- **dist/** – TypeScript compilation output

## Installation

### Prerequisites

- Node.js 18.16.1
- Yarn 1.22.19
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
Starts both Express server and React dev server with hot reload.

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

## Testing

### Run All Tests
```bash
# Unit tests (443 tests)
yarn test:unit

# E2E tests (76 tests)
yarn test:e2e

# All tests
yarn test
```

### Test Organization
- **src/__tests__/unit/** – Unit tests for services, controllers, utilities
- **src/__tests__/integration/** – Integration tests for API endpoints
- **client/src/**/*.e2e.test.tsx** – End-to-end tests with Playwright

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
Runs the compiled server from `dist/server.js`, serving the built client from `client/build/`.

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

## API Architecture

All API endpoints follow the pattern `/api/[resource]/[action]` with modular route organization:

### Key Endpoints
- **Orders** – `/api/orders/*` (create, list, update, refund)
- **Products** – `/api/products/*` (list, update, sync)
- **Customers** – `/api/customers/*` (list, create, update)
- **Employees** – `/api/employees/*` (manage, clock entries, hours)
- **Memberships** – `/api/members/*` (profiles, attendance, discounts)
- **Gift Cards** – `/api/giftcards/*` (create, activate, balance)
- **KDS** – `/api/kds/*` (orders, updates, status)
- **Transactions** – `/api/transactions/*` (tender transactions, POS operations)
- **Auth** – `/api/validate-device`, `/api/verify-passcode`

### Webhook Endpoints
- **Stripe** – `/webhooks/stripe` (payment webhooks)
- **Shopify** – `/webhooks/shopify` (product/order webhooks)
- **SEAL** – `/webhooks/seal` (membership webhooks)

### Public Endpoints (No JWT Required)
- **Stripe** – `/create-portal-redirect/:customerId`, `/create-payment-intent`
- **Media** – `/qr/:data.jpg`, `/card/:cardType/:data/:type.png`
- **Auth** – `/api/validate-device`, `/api/verify-passcode`
- **Employee Login** – `GET /api/employee/:code`

See `src/routes/` for complete route definitions and implementations.

## Project Structure

```
posdashboard/
├── server.ts              # Main server entry point
├── src/
│   ├── config/           # Configuration modules
│   ├── routes/           # API route definitions
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   └── __tests__/        # Test suites
├── client/               # React frontend
│   └── src/
│       ├── components/      # UI components
│       └── pages/          # Page components
├── dist/                 # Compiled output
└── public/               # Static assets
```

## Development Workflow

### Adding a New API Endpoint

1. Create service function in `src/services/[domain]Service.ts`
2. Create controller function in `src/controllers/[domain]Controller.ts`
3. Add route to `src/routes/[domain].ts`
4. Write unit tests in `src/__tests__/unit/`
5. Update types in `src/types/` if needed

### Adding a New Page

1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link in sidebar
4. Create corresponding API endpoints (see above)
5. Add E2E tests if needed

## License

Proprietary - ZDT Amusement Park
