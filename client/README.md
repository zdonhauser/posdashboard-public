# ZDT POS Dashboard Client

React frontend for the ZDT Point of Sale system dashboard, providing a comprehensive management interface for restaurant operations.

## Overview

This React application serves as the web-based dashboard for the POS system, offering:

- **Multi-role Interfaces**: Different views for Front, Kitchen, and Manager staff
- **Real-time Updates**: Socket.IO integration for live order and system updates
- **Touch-friendly Design**: Optimized for tablets and touch devices
- **Material-UI Components**: Modern, responsive interface design

## Tech Stack

- **React 18.2** with TypeScript
- **Material-UI** for component library and theming
- **Socket.IO Client** for real-time communication
- **React Router** for client-side navigation
- **Axios** for HTTP API calls
- **React Hook Form** for form management
- **Recharts** for data visualization

## Key Features

### Point of Sale
- `/pos` - Front counter POS interface
- `/pos-kitchen` - Kitchen staff POS interface
- Real-time order management
- Payment processing integration

### Kitchen Display System
- `/kds` - Main kitchen display
- `/kds-pickup` - Pickup orders display  
- `/kds-recall` - Recalled orders display
- Live order status updates

### Management
- `/daily-reports` - Sales and performance analytics
- `/register-reports` - Individual register reconciliation
- `/employees` - Staff management
- `/employeehours` - Time tracking and payroll

### Customer & Inventory
- `/members` - Member database with photo storage
- `/visits` - Membership visit tracking
- `/gift-cards` - Gift card management
- `/parties` - Party booking system
- `/groups` - Group event coordination

### System
- `/settings` - System configuration
- `/login` - User authentication
- `/clockin` - Employee time clock

## Development

### Start Development Server
```bash
yarn start-local    # Local development (connects to localhost:8080)
yarn start          # Production-like (connects to configured API)
```

### Build for Production
```bash
yarn build
```

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── POSWindow/       # Main POS interface
│   ├── KDS/             # Kitchen Display System
│   ├── DailyReports/    # Reporting components
│   ├── Login/           # Authentication
│   └── ...              # Other feature components
├── contexts/            # React Context providers
├── images/              # Static assets and icons
└── globals.d.ts         # TypeScript declarations
```

## Key Components

### POSWindow
Main point-of-sale interface supporting different modes (front, kitchen) with transaction processing, product selection, and payment integration.

### KDS (Kitchen Display System)  
Real-time order tracking system with different display modes for kitchen workflow management.

### DailyReports
Analytics dashboard with sales data, transaction summaries, and performance metrics visualization.

### Login & DeviceLock
Authentication system with device registration and role-based access control.

## Real-time Features

The client maintains persistent Socket.IO connections to receive:
- New order notifications
- Order status updates
- Kitchen display updates
- System configuration changes
- Employee clock-in/out events

## Configuration

### Environment Variables
Copy `.env.example` to `.env` if you need to customize the build:

```env
NODE_PATH=../node_modules
```

### API Endpoints
The client adapts its API endpoints based on the environment:
- **Development**: `http://localhost:8080` (dashboard server)
- **Production**: Configured server URL from build
- **Electron**: IPC communication with desktop app

### Build Configuration
The React app automatically configures itself based on:
- `yarn start-local` - Connects to localhost:8080
- `yarn start` - Uses production configuration
- Electron mode - Uses IPC instead of HTTP

## Authentication

Role-based access control with three main user types:
- **Front**: POS operations, basic reporting, settings
- **Kitchen**: Kitchen POS, KDS displays, order management  
- **Manager**: Full access to all features and reports

## Browser Support

Optimized for modern browsers with touch device support for tablet POS terminals. Works in both portrait and landscape orientations.