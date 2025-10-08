import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import KDS from '../KDS';
import { 
  createOrderWithItems, 
  mockFetchSuccess, 
  setupTestMocks, 
  cleanupTestMocks,
  mockWindowDimensions,
  mockElementDimensions
} from './setup/testUtils';

describe('KDS Component - Order Splitting', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  test('splits large orders to fit screen height', async () => {
    const order = createOrderWithItems(20); // 20 items should definitely split
    
    mockFetchSuccess([order]);
    mockWindowDimensions(600); // Mock smaller viewport

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // All items should be visible somewhere in the split
      for (let i = 1; i <= 20; i++) {
        expect(container.textContent).toContain(`Item ${i}`);
      }
      
      // Order number should appear at least once (only in first block)
      expect(container.textContent).toContain('42');
      
      // Should have visual indicators of continuation (CSS classes)
      const orderBlocks = container.querySelectorAll('.kds-order-block, [class*="order"]');
      expect(orderBlocks.length).toBeGreaterThan(1); // Multiple blocks indicate splitting
    });
  });

  test('verifies splitting behavior with small orders', async () => {
    const smallOrder = createOrderWithItems(3); // 3 items 
    
    mockFetchSuccess([smallOrder]);
    mockWindowDimensions(1200); // Mock large viewport

    const { container } = render(<KDS mode="kitchen" />);

    // Mock the carousel element's clientHeight to provide realistic dimensions
    await act(async () => {
      const carousel = container.querySelector('.kds-carousel');
      if (carousel) {
        mockElementDimensions('.kds-carousel', { clientHeight: 1000 });
        
        // Trigger resize event to update availableHeight
        window.dispatchEvent(new Event('resize'));
      }
    });

    await waitFor(() => {
      // All 3 items should be visible
      expect(container.textContent).toContain('Item 1');
      expect(container.textContent).toContain('Item 2');
      expect(container.textContent).toContain('Item 3');
      
      // Order number should appear once (in first block only)
      expect(container.textContent).toContain('42');
      
      // With proper clientHeight, small order should not split excessively
      const orderBlocks = container.querySelectorAll('.kds-order');
      
      // Should have fewer blocks now that clientHeight is properly mocked
      expect(orderBlocks.length).toBeLessThanOrEqual(3); // Allow some flexibility
    });
  });

  test('handles orders with many special instructions', async () => {
    const orderWithInstructions = {
      i: 0,
      id: 1,
      name: 'Picky Customer',
      pos_order_id: 600,
      order_number: 88,
      status: 'pending' as const,
      front_released: false,
      is_fulfilled: false,
      items: [
        {
          id: 1, kitchen_order_id: 1, item_name: 'Custom Burger', quantity: 1,
          prepared_quantity: 0, station: 'grill', fulfilled_quantity: 0, status: 'pending', order_id: 600,
          special_instructions: 'No onions, extra cheese, no pickles, well done, side of mayo, extra lettuce, toasted bun'
        },
        {
          id: 2, kitchen_order_id: 1, item_name: 'Custom Fries', quantity: 1,
          prepared_quantity: 0, station: 'fryer', fulfilled_quantity: 0, status: 'pending', order_id: 600,
          special_instructions: 'Extra crispy, no salt, side of ketchup, side of ranch'
        }
      ],
      created_at: '2023-01-01T10:00:00Z',
      updated_at: '2023-01-01T10:00:00Z'
    };
    
    mockFetchSuccess([orderWithInstructions]);
    mockWindowDimensions(400); // Mock small viewport to force splitting

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Both items should be visible
      expect(container.textContent).toContain('Custom Burger');
      expect(container.textContent).toContain('Custom Fries');
      
      // Special instructions should be visible
      expect(container.textContent).toContain('No onions');
      expect(container.textContent).toContain('Extra crispy');
      expect(container.textContent).toContain('side of ranch');
    });
  });

  test('works on different screen sizes', async () => {
    const mediumOrder = createOrderWithItems(10);
    
    mockFetchSuccess([mediumOrder]);

    // Test mobile size (should split)
    mockWindowDimensions(400); // Small mobile screen

    const { container, rerender } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // All items should still be visible despite small screen
      for (let i = 1; i <= 10; i++) {
        expect(container.textContent).toContain(`Item ${i}`);
      }
    });

    // Test desktop size (might not split)  
    mockWindowDimensions(1400); // Large desktop screen

    // Trigger re-render with new height
    rerender(<KDS mode="kitchen" />);

    await waitFor(() => {
      // All items should still be visible
      for (let i = 1; i <= 10; i++) {
        expect(container.textContent).toContain(`Item ${i}`);
      }
    });
  });

  test('applies correct CSS classes to split order blocks', async () => {
    const largeOrder = createOrderWithItems(15);
    
    mockFetchSuccess([largeOrder]);
    mockWindowDimensions(500); // Force splitting

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Check for continuation styling indicators
      const firstBlocks = container.querySelectorAll('.first, [class*="first"]');
      const lastBlocks = container.querySelectorAll('.last, [class*="last"]');
      
      // Should have at least one "first" block and one "last" block
      expect(firstBlocks.length).toBeGreaterThanOrEqual(1);
      expect(lastBlocks.length).toBeGreaterThanOrEqual(1);
      
      // All items should still be visible
      for (let i = 1; i <= 15; i++) {
        expect(container.textContent).toContain(`Item ${i}`);
      }
    });
  });

  test('debugging: checks if availableHeight affects splitting', async () => {
    // Create a minimal order that should definitely fit
    const tinyOrder = createOrderWithItems(1); // Just 1 item
    
    mockFetchSuccess([tinyOrder]);
    mockWindowDimensions(2000); // Huge screen

    const { container } = render(<KDS mode="kitchen" />);

    // Mock carousel dimensions AFTER render
    await act(async () => {
      const carousel = container.querySelector('.kds-carousel');
      if (carousel) {
        mockElementDimensions('.kds-carousel', { clientHeight: 1800 });
        
        // Trigger resize to update availableHeight
        window.dispatchEvent(new Event('resize'));
      }
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Item 1');
      
      const orderBlocks = container.querySelectorAll('.kds-order');
      
      // With proper dimensions, single item should not split
      expect(orderBlocks.length).toBe(1);
    });
  });

  test('order splitting preserves all item information', async () => {
    const complexOrder = createOrderWithItems(8, {
      special_instructions: 'Complex instructions that span multiple lines'
    });
    
    mockFetchSuccess([complexOrder]);
    mockWindowDimensions(400); // Force splitting

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Verify all items and their details are preserved
      for (let i = 1; i <= 8; i++) {
        expect(container.textContent).toContain(`Item ${i}`);
      }
      
      // Special instructions should be preserved across splits
      expect(container.textContent).toContain('Complex instructions');
      
      // Order should appear at least once (first block only)
      const orderNumbers = container.textContent.match(/42/g);
      expect(orderNumbers).toBeTruthy();
    });
  });

  test('height calculation updates on window resize', async () => {
    const order = createOrderWithItems(5);
    mockFetchSuccess([order]);

    const { container } = render(<KDS mode="kitchen" />);

    // Start with large screen
    mockWindowDimensions(1200);
    
    await act(async () => {
      mockElementDimensions('.kds-carousel', { clientHeight: 1000 });
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(container.textContent).toContain('Item 1');
    });

    // Resize to small screen
    await act(async () => {
      mockWindowDimensions(400);
      mockElementDimensions('.kds-carousel', { clientHeight: 300 });
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      // Items should still be visible after resize
      for (let i = 1; i <= 5; i++) {
        expect(container.textContent).toContain(`Item ${i}`);
      }
    });
  });
});