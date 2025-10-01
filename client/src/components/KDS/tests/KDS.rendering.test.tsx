import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KDS from '../KDS';
import { 
  createMockOrder, 
  createMockItem, 
  mockFetchSuccess, 
  mockFetchError, 
  setupTestMocks, 
  cleanupTestMocks 
} from './setup/testUtils';

describe('KDS Component - Rendering & Display', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  test('renders KDS component in kitchen mode', async () => {
    mockFetchSuccess([]);
    
    const { container } = render(<KDS mode="kitchen" />);
    
    await waitFor(() => {
      expect(container.firstChild).toBeTruthy();
    });
  });

  test('displays orders with correct information', async () => {
    const mockOrders = [
      createMockOrder({
        name: 'John Doe',
        order_number: 42,
        items: [
          createMockItem({
            id: 1,
            item_name: 'Cheeseburger',
            quantity: 2,
            station: 'grill',
            special_instructions: 'No pickles'
          }),
          createMockItem({
            id: 2,
            item_name: 'French Fries',
            quantity: 1,
            station: 'fryer',
            special_instructions: null
          })
        ]
      })
    ];

    mockFetchSuccess(mockOrders);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Check that order number displays
      expect(container.textContent).toContain('42');
      
      // Check that customer name displays  
      expect(container.textContent).toContain('John Doe');
      
      // Check that menu items display
      expect(container.textContent).toContain('Cheeseburger');
      expect(container.textContent).toContain('French Fries');
      
      // Check that special instructions display
      expect(container.textContent).toContain('No pickles');
      
      // Check that quantities display
      expect(container.textContent).toContain('2'); // quantity of cheeseburger
    });
  });

  test('displays multiple orders correctly', async () => {
    const mockOrders = [
      createMockOrder({
        id: 1,
        name: 'Alice Smith',
        pos_order_id: 100,
        order_number: 10,
        status: 'pending',
        items: [createMockItem({ 
          id: 1, 
          kitchen_order_id: 1, 
          item_name: 'Pizza', 
          quantity: 1,
          station: 'oven', 
          special_instructions: null,
          order_id: 100
        })]
      }),
      createMockOrder({
        i: 1,
        id: 2,
        name: 'Bob Jones',
        pos_order_id: 200,
        order_number: 11,
        status: 'in_progress',
        items: [createMockItem({ 
          id: 2, 
          kitchen_order_id: 2, 
          item_name: 'Salad', 
          quantity: 1,
          station: 'cold', 
          special_instructions: 'Extra dressing',
          order_id: 200
        })]
      })
    ];

    mockFetchSuccess(mockOrders);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Both orders should be visible
      expect(container.textContent).toContain('Alice Smith');
      expect(container.textContent).toContain('Bob Jones');
      expect(container.textContent).toContain('Pizza');
      expect(container.textContent).toContain('Salad');
      expect(container.textContent).toContain('10'); // order number
      expect(container.textContent).toContain('11'); // order number
      expect(container.textContent).toContain('Extra dressing');
    });
  });

  test('shows empty state when no orders', async () => {
    mockFetchSuccess([]);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Should render without orders, just the container
      expect(container.firstChild).toBeTruthy();
      // Should not have any order-specific content
      expect(container.textContent).not.toContain('Order #');
    });
  });

  test('handles API error gracefully', async () => {
    mockFetchError(500);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Component should still render even if API fails
      expect(container.firstChild).toBeTruthy();
    });
  });

  test('displays different order statuses correctly', async () => {
    const mockOrders = [
      createMockOrder({
        name: 'Test Customer',
        pos_order_id: 300,
        order_number: 20,
        status: 'ready',
        front_released: true,
        items: [createMockItem({ 
          id: 1, 
          kitchen_order_id: 1, 
          item_name: 'Sandwich', 
          quantity: 1,
          prepared_quantity: 1, 
          station: 'grill', 
          special_instructions: null,
          status: 'ready', 
          order_id: 300
        })]
      })
    ];

    mockFetchSuccess(mockOrders);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(container.textContent).toContain('Test Customer');
      expect(container.textContent).toContain('Sandwich');
      expect(container.textContent).toContain('20');
    });
  });

  test('displays kitchen summary footer with item counts', async () => {
    const mockOrders = [
      createMockOrder({
        items: [
          createMockItem({
            item_name: 'Burger',
            quantity: 2,
            prepared_quantity: 0,
            station: 'grill'
          }),
          createMockItem({
            id: 2,
            item_name: 'Fries', 
            quantity: 1,
            prepared_quantity: 0,
            station: 'fryer'
          })
        ]
      }),
      createMockOrder({
        id: 2,
        items: [
          createMockItem({
            id: 3,
            item_name: 'Burger',
            quantity: 1, 
            prepared_quantity: 0,
            station: 'grill'
          })
        ]
      })
    ];

    mockFetchSuccess(mockOrders);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Should show summary with unprepared item counts
      expect(container.textContent).toContain('Burger: 3'); // 2 + 1 unprepared
      expect(container.textContent).toContain('Fries: 1'); // 1 unprepared
      expect(container.textContent).toContain('Total Orders: 2');
    });
  });

  test('does not display summary in pickup mode', async () => {
    const mockOrders = [createMockOrder()];
    mockFetchSuccess(mockOrders);

    const { container } = render(<KDS mode="pickup" />);

    await waitFor(() => {
      expect(container.textContent).not.toContain('Total Orders');
    });
  });
});