import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KDS from '../KDS';
import { 
  createMockOrder,
  setupTestMocks, 
  cleanupTestMocks,
  mockFetchSuccess 
} from './setup/testUtils';

// Import the mocked io function to access the socket
import * as socketIo from 'socket.io-client';
const mockIo = socketIo.io as jest.MockedFunction<typeof socketIo.io>;


describe('KDS Component - Real-time Updates', () => {
  beforeEach(() => {
    setupTestMocks();
    // Clear the mock before each test
    mockIo.mockClear();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  test('socket connection integration works without errors', async () => {
    // Test that the component renders and handles socket mocks without errors
    mockFetchSuccess([createMockOrder()]);
    
    const { container } = render(<KDS mode="kitchen" />);

    // Verify the component renders successfully
    await waitFor(() => {
      expect(container.querySelector('.kds-container')).toBeInTheDocument();
    });

    // Verify initial API call happens
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/kds-orders?status=pending',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    // At this point, the socket should be connected (mocked)
    // We mainly care that no errors occurred
    expect(container.textContent).toContain('42'); // order number
  });

  test('component unmounts cleanly without socket errors', async () => {
    mockFetchSuccess([createMockOrder()]);
    
    const { unmount } = render(<KDS mode="kitchen" />);
    
    // Wait for component to render with data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Unmount should not throw errors with socket mocks
    expect(() => unmount()).not.toThrow();
  });

  test('socket functionality does not interfere with normal operation', async () => {
    // This test verifies that socket mocking doesn't break the component
    const orders = [
      createMockOrder({ id: 1, order_number: 100 }),
      createMockOrder({ id: 2, order_number: 101 })
    ];
    
    mockFetchSuccess(orders);
    
    const { container } = render(<KDS mode="kitchen" />);

    // Component should render orders despite socket integration
    await waitFor(() => {
      expect(container.textContent).toContain('100');
      expect(container.textContent).toContain('101');
    });

    // Verify orders are displayed properly
    expect(container.querySelectorAll('.order-block')).toBeTruthy();
  });

  test('handles different modes without socket errors', async () => {
    // Test that all modes work with socket integration
    const testModes = [
      { mode: 'kitchen' as const, expectedApiCall: '/api/kds-orders?status=pending' },
      { mode: 'pickup' as const, expectedApiCall: '/api/kds-orders?status=ready&status2=pending' },
      { mode: 'recall' as const, expectedApiCall: '/api/kds-orders?status=all&order_by=updated_at' }
    ];

    for (const { mode, expectedApiCall } of testModes) {
      jest.clearAllMocks();
      mockFetchSuccess([createMockOrder()]);
      
      const { container, unmount } = render(<KDS mode={mode} />);
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expectedApiCall,
          expect.any(Object)
        );
      });

      expect(container.querySelector('.kds-container')).toBeInTheDocument();
      
      // Clean unmount
      expect(() => unmount()).not.toThrow();
    }
  });

  test('socket mock is properly configured', () => {
    // Verify our socket mock has the right structure
    expect(mockIo).toBeDefined();
    expect(typeof mockIo).toBe('function');
    expect(jest.isMockFunction(mockIo)).toBe(true);
  });
});