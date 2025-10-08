# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
ZDT POS Dashboard - React-based web management interface for the POS system, providing real-time monitoring, reporting, inventory management, and system configuration.

## Development Commands

### Quick Start
```bash
# Development server with hot reload
yarn start-all

# Frontend only (port 3000)
yarn start

# Backend only (port 3001)
yarn server

# Production build
yarn build
```

### Testing & Linting
```bash
# Run tests
yarn test

# Type checking
yarn tsc --noEmit
```

## Architecture

### Frontend Stack
- **React 18.2** with TypeScript
- **Material-UI** for component library
- **React Router** for navigation
- **Axios** for API calls
- **Socket.IO Client** for real-time updates
- **Recharts** for data visualization
- **React Query** for server state management

### Backend Stack
- **Express** server (`server.ts`)
- **Socket.IO** for WebSocket connections
- **PostgreSQL** via pg library
- **Stripe API** integration
- **Shopify Admin API** integration
- **JWT-based authentication**

### Directory Structure
```
posdashboard/
├── server.ts              # Main server entry point
├── src/
│   ├── config/           # Configuration modules
│   │   ├── database.ts      # PostgreSQL configuration
│   │   ├── stripe.ts        # Stripe configuration
│   │   ├── shopify.ts       # Shopify configuration
│   │   ├── drive.ts         # Google Drive configuration
│   │   ├── socket.ts        # Socket.IO setup
│   │   └── environment.ts   # Environment variables
│   ├── routes/           # Route definitions (modular)
│   │   ├── index.ts         # Route aggregator
│   │   ├── employees.ts     # Employee routes
│   │   ├── memberships.ts   # Membership routes
│   │   ├── giftcards.ts     # Gift card routes
│   │   ├── orders.ts        # Order/customer routes
│   │   ├── kds.ts           # Kitchen display routes
│   │   ├── shopify.ts       # Shopify/product routes
│   │   ├── transactions.ts  # Transaction/POS routes
│   │   ├── stripe.ts        # Stripe routes
│   │   ├── media.ts         # QR code/card generation
│   │   ├── auth.ts          # Auth routes
│   │   ├── customers.ts     # Customer routes
│   │   ├── pos.ts           # POS routes
│   │   └── webhooks.ts      # Webhook handlers
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   │   ├── verifyPasscode.ts
│   │   └── errorHandler.ts
│   ├── utils/            # Utility functions
│   │   ├── locks.ts         # Locking mechanisms
│   │   ├── auth.ts          # Auth utilities
│   │   ├── qr-generator.ts  # QR code generation
│   │   └── card-generator.ts # Card generation
│   ├── types/            # TypeScript type definitions
│   └── __tests__/        # Test suites
│       ├── unit/            # Unit tests (443 tests)
│       └── integration/     # Integration tests
├── client/               # React frontend
│   └── src/
│       ├── components/      # UI components
│       ├── pages/          # Page components
│       └── App.tsx         # React app
└── dist/                 # Compiled JavaScript output
```

## Key Features & Routes

### Dashboard Pages
- `/pos` - Point of Sale interface (front counter)
- `/pos-kitchen` - Kitchen Point of Sale interface
- `/parties` - View Party Book (manager only)
- `/party` - Book a Party (manager only)
- `/groups` - Book a Group (manager only)
- `/daily-reports` - Daily Reports (manager only)
- `/register-reports` - Register Reports (manager only)
- `/employees` - Employee management (manager only)
- `/employeehours` - Employee Hours tracking (manager only)
- `/gift-cards` - Gift Card management (manager only)
- `/members` - Member database (manager only)
- `/visits` - Membership Visits tracking (manager only)
- `/kds` - Kitchen Display System (kitchen/front staff)
- `/kds-pickup` - Pickup KDS (kitchen/front staff)
- `/kds-recall` - Recall KDS (kitchen/front staff)
- `/settings` - System configuration (front staff)
- `/login` - User login page
- `/clockin` - Employee clock-in interface

### API Endpoints
```typescript
// Order Management
POST   /api/orders/create
GET    /api/orders/list
PUT    /api/orders/update
POST   /api/orders/refund

// Product Management  
GET    /api/products/list
POST   /api/products/update
POST   /api/products/sync-shopify
DELETE /api/products/:id

// Customer Management
GET    /api/customers/list
POST   /api/customers/create
PUT    /api/customers/:id

// Reports & Analytics
GET    /api/reports/sales
GET    /api/reports/inventory
GET    /api/reports/customers
POST   /api/reports/export
```

## Real-Time Events

### Socket.IO Channels
```typescript
// Incoming events from POS terminals
socket.on('order:created', (order) => {})
socket.on('payment:processed', (payment) => {})
socket.on('inventory:updated', (product) => {})

// Outgoing events to POS terminals
socket.emit('config:updated', config)
socket.emit('product:priceChanged', product)
socket.emit('discount:activated', discount)
```

## Database Queries

### Common Query Patterns
```typescript
// Paginated lists with filters
const getOrders = async (page, limit, filters) => {
  return db.query(`
    SELECT * FROM orders 
    WHERE store_id = $1 
    AND created_at BETWEEN $2 AND $3
    ORDER BY created_at DESC
    LIMIT $4 OFFSET $5
  `, [storeId, startDate, endDate, limit, offset])
}

// Aggregated reports
const getSalesReport = async (period) => {
  return db.query(`
    SELECT 
      DATE_TRUNC($1, created_at) as period,
      SUM(total) as revenue,
      COUNT(*) as orders
    FROM orders
    GROUP BY period
    ORDER BY period DESC
  `, [period])
}
```

## State Management

### Global State
- User authentication state in Context API
- Real-time data updates via Socket.IO hooks
- Form state management with React Hook Form
- Server state caching with React Query

### Local Storage
- User preferences
- Dashboard layout settings
- Recent searches
- Cached report filters

## Integrations

### Stripe Integration
- Payment intent creation
- Refund processing
- Terminal reader management
- Webhook handling at `/webhooks/stripe`

### Shopify Integration  
- Product catalog sync
- Order fulfillment
- Inventory updates
- Webhook handling at `/webhooks/shopify`

## Environment Variables
```
PORT=3001
DATABASE_URL=postgresql://connection_string
STRIPE_SECRET_KEY=sk_live_xxx
SHOPIFY_ACCESS_TOKEN=shpat_xxx
SHOPIFY_WEBHOOK_SECRET=xxx
SESSION_SECRET=xxx
GOOGLE_DRIVE_API_KEY=xxx
```

## Security Patterns
- Session-based authentication with express-session
- CORS configured for POS terminal origins
- Rate limiting on API endpoints
- Input validation with express-validator
- SQL injection prevention via parameterized queries

## Common Development Tasks

### Adding a New API Endpoint
1. Create service function in `src/services/[domain]Service.ts`
2. Create controller function in `src/controllers/[domain]Controller.ts`
3. Add route to `src/routes/[domain].ts`
4. Import route in `src/routes/index.ts` (if new domain)
5. Write unit tests in `src/__tests__/unit/`
6. Add Socket.IO events if real-time updates needed

### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Add navigation link in sidebar
4. Create corresponding API endpoints (see above)
5. Add E2E tests if needed

### Modifying Database Schema
1. Create migration file
2. Update TypeScript interfaces in `src/types/`
3. Update service functions in `src/services/`
4. Update controller functions in `src/controllers/`
5. Update frontend components
6. Test data integrity