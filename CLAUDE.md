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
- **Express** server (`index.tsx`)
- **Socket.IO** for WebSocket connections
- **PostgreSQL** via pg library
- **Stripe API** integration
- **Shopify Admin API** integration
- **Session-based authentication**

### Directory Structure
```
posdashboard/
├── src/                    # React frontend
│   ├── components/        # Reusable UI components
│   ├── pages/            # Route-based page components
│   ├── services/         # API service layer
│   └── utils/            # Helper functions
├── server/               # Express backend (if separate)
├── public/               # Static assets
└── index.tsx            # Express server entry point
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

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Add navigation link in sidebar
4. Create corresponding API endpoints
5. Add Socket.IO events if real-time updates needed

### Adding API Endpoint
1. Define route in `index.tsx`
2. Add validation middleware
3. Implement database queries
4. Add error handling
5. Emit Socket.IO events for real-time updates

### Modifying Database Schema
1. Create migration file
2. Update TypeScript interfaces
3. Update API endpoints
4. Update frontend components
5. Test data integrity