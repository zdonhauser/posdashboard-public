import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import KDS from '../KDS';
import { 
  createMockOrder, 
  createMockItem,
  setupTestMocks, 
  cleanupTestMocks,
  mockFetchSuccess 
} from './setup/testUtils';

describe('KDS Component - Interactions & Status Changes', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  test('handles item status toggle API calls', async () => {
    const mockOrder = createMockOrder({
      items: [
        createMockItem({
          id: 1,
          item_name: 'Test Item',
          status: 'pending',
          prepared_quantity: 0,
          quantity: 1
        })
      ]
    });

    mockFetchSuccess([mockOrder]);

    // Mock the item update API call
    const mockItemUpdate = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockOrder])
      })
      .mockImplementation(mockItemUpdate);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(container.textContent).toContain('Test Item');
    });

    // Find and click the checkbox to toggle item status
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeTruthy();
    
    if (checkbox) {
      fireEvent.click(checkbox);
      
      // Verify the API call was made
      await waitFor(() => {
        expect(mockItemUpdate).toHaveBeenCalledWith(
          '/api/kds-items/1/mark-prepared',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json; charset=UTF-8',
              'Authorization': 'Bearer mock-token'
            })
          })
        );
      });
    }
  });

  test('handles order status transitions', async () => {
    const mockOrder = createMockOrder({
      status: 'pending',
      items: [
        createMockItem({
          prepared_quantity: 0,
          quantity: 1
        })
      ]
    });

    mockFetchSuccess([mockOrder]);

    const mockOrderUpdate = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockOrder])
      })
      .mockImplementation(mockOrderUpdate);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(container.textContent).toContain('42');
    });

    // Find and click the "Mark Ready" button
    const readyButton = container.querySelector('.all-ready-button');
    expect(readyButton).toBeTruthy();
    
    if (readyButton) {
      fireEvent.click(readyButton);
      
      // Verify the order status API call was made
      await waitFor(() => {
        expect(mockOrderUpdate).toHaveBeenCalledWith(
          '/api/kds-orders/1/mark-ready?skipItemUpdate=false',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json; charset=UTF-8',
              'Authorization': 'Bearer mock-token'
            })
          })
        );
      });
    }
  });

  test('optimistically updates UI before API response', async () => {
    const mockOrder = createMockOrder({
      items: [
        createMockItem({
          id: 1,
          prepared_quantity: 0,
          quantity: 1,
          status: 'pending'
        })
      ]
    });

    mockFetchSuccess([mockOrder]);

    // Delay the API response to test optimistic updates
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockOrder])
      })
      .mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ ok: true }), 100)
      ));

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(container.textContent).toContain('Test Item');
    });

    const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox?.checked).toBe(false);

    // Click to toggle item status
    if (checkbox) {
      fireEvent.click(checkbox);
      
      // UI should update immediately (optimistically)
      expect(checkbox.checked).toBe(true);
    }
  });

  test('handles API errors during status updates', async () => {
    const mockOrder = createMockOrder({
      items: [createMockItem({ id: 1 })]
    });

    mockFetchSuccess([mockOrder]);

    // Mock API failure
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockOrder])
      })
      .mockRejectedValueOnce(new Error('API Error'));

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(container.textContent).toContain('Test Item');
    });

    const checkbox = container.querySelector('input[type="checkbox"]');
    
    if (checkbox) {
      fireEvent.click(checkbox);
      
      // Should handle the error gracefully
      await waitFor(() => {
        // Component should still be functional
        expect(container.firstChild).toBeTruthy();
      });
    }
  });

  test('prevents concurrent API calls with processing counter', async () => {
    const mockOrder = createMockOrder({
      items: [
        createMockItem({ id: 1 }),
        createMockItem({ id: 2 })
      ]
    });

    mockFetchSuccess([mockOrder]);

    const mockApiCall = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true }), 50))
    );

    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockOrder])
      })
      .mockImplementation(mockApiCall);

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(container.textContent).toContain('Test Item');
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    
    // Rapidly click multiple checkboxes
    checkboxes.forEach(checkbox => {
      fireEvent.click(checkbox);
    });

    // Wait for API calls to complete
    await waitFor(() => {
      expect(mockApiCall).toHaveBeenCalledTimes(2);
    }, { timeout: 200 });
  });
});