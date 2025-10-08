import { KDSOrder, KDSItem } from '../../KDS';

// Mock Socket.IO before imports
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  }))
}));

jest.mock('react-toastify', () => ({
  toast: {
    warn: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    update: jest.fn(),
  }
}));

// Factory function to create mock KDS items
export const createMockItem = (overrides: Partial<KDSItem> = {}): KDSItem => ({
  id: 1,
  kitchen_order_id: 1,
  item_name: 'Test Item',
  quantity: 1,
  prepared_quantity: 0,
  station: 'kitchen',
  special_instructions: null,
  fulfilled_quantity: 0,
  status: 'pending',
  order_id: 123,
  ...overrides
});

// Factory function to create mock KDS orders
export const createMockOrder = (overrides: Partial<KDSOrder> = {}): KDSOrder => ({
  i: 0,
  id: 1,
  name: 'Test Customer',
  pos_order_id: 123,
  order_number: 42,
  status: 'pending',
  front_released: false,
  is_fulfilled: false,
  items: [createMockItem()],
  created_at: '2023-01-01T10:00:00Z',
  updated_at: '2023-01-01T10:00:00Z',
  ...overrides
});

// Helper to create order with multiple items
export const createOrderWithItems = (itemCount: number, itemOverrides: Partial<KDSItem> = {}): KDSOrder => ({
  ...createMockOrder(),
  items: Array.from({ length: itemCount }, (_, index) => 
    createMockItem({
      id: index + 1,
      item_name: `Item ${index + 1}`,
      special_instructions: index % 3 === 0 ? 'Special instructions here' : null,
      ...itemOverrides
    })
  )
});

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data)
    })
  ) as jest.Mock;
};

export const mockFetchError = (status = 500) => {
  global.fetch = jest.fn(() => 
    Promise.resolve({
      ok: false,
      status
    })
  ) as jest.Mock;
};

// Mock DOM element properties for JSDOM limitations
export const mockElementDimensions = (selector: string, dimensions: { clientHeight?: number; clientWidth?: number }) => {
  const element = document.querySelector(selector);
  if (element) {
    if (dimensions.clientHeight) {
      Object.defineProperty(element, 'clientHeight', {
        configurable: true,
        value: dimensions.clientHeight,
      });
    }
    if (dimensions.clientWidth) {
      Object.defineProperty(element, 'clientWidth', {
        configurable: true,
        value: dimensions.clientWidth,
      });
    }
  }
};

// Mock window dimensions
export const mockWindowDimensions = (height: number, width?: number) => {
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  if (width) {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  }
};

// Setup function to run before each test
export const setupTestMocks = () => {
  // Clear all mocks between tests
  jest.clearAllMocks();
  
  // Mock sessionStorage for auth tokens
  const mockSessionStorage = {
    getItem: jest.fn().mockReturnValue('mock-token'),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
  });
  
  // Reset window dimensions to default
  mockWindowDimensions(1200, 1920);
};

// Cleanup function to run after each test
export const cleanupTestMocks = () => {
  jest.restoreAllMocks();
};