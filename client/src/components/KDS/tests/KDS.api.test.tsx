import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KDS from '../KDS';
import { 
  createMockOrder, 
  setupTestMocks, 
  cleanupTestMocks 
} from './setup/testUtils';

describe('KDS Component - API & Modes', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  test('kitchen mode calls correct API endpoint', async () => {
    const mockOrders = [createMockOrder()];
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrders)
    });

    render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/kds-orders?status=pending`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  test('pickup mode calls correct API endpoint', async () => {
    const mockOrders = [createMockOrder({ status: 'ready' })];
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrders)
    });

    render(<KDS mode="pickup" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/kds-orders?status=ready&status2=pending`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  test('recall mode calls correct API endpoint', async () => {
    const mockOrders = [createMockOrder({ status: 'fulfilled' })];
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOrders)
    });

    render(<KDS mode="recall" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/kds-orders?status=all&order_by=updated_at`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  test('handles missing authentication token', async () => {
    // Mock sessionStorage to return null
    window.sessionStorage.getItem = jest.fn().mockReturnValue(null);
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });

    render(<KDS mode="kitchen" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/kds-orders?status=pending`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer null'
          })
        })
      );
    });
  });

  test('handles API response errors gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Component should still render despite API error
      expect(container.firstChild).toBeTruthy();
    });
  });

  test('handles network errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { container } = render(<KDS mode="kitchen" />);

    await waitFor(() => {
      // Component should still render despite network error
      expect(container.firstChild).toBeTruthy();
    });
  });
});