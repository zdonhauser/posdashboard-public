import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KdsOrderBlock from '../KdsOrderBlock';
import { createMockOrder, setupTestMocks, cleanupTestMocks } from './setup/testUtils';

describe('KdsOrderBlock Component', () => {
  const mockHandleOrderStatus = jest.fn();
  const mockHandleItemToggle = jest.fn();
  const mockRestoreOrder = jest.fn();

  beforeEach(() => {
    setupTestMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  test('renders order block with basic information', () => {
    const order = createMockOrder({
      name: 'John Doe',
      order_number: 123,
      isFirst: true,
      isLast: true
    });

    const { container } = render(
      <KdsOrderBlock
        order={order}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    expect(container.textContent).toContain('123');
    expect(container.textContent).toContain('John Doe');
    expect(container.textContent).toContain('Test Item');
  });

  test('shows order header only for first block', () => {
    const orderFirst = createMockOrder({ isFirst: true, isLast: false });
    const orderMiddle = createMockOrder({ isFirst: false, isLast: false });

    const { container: firstContainer } = render(
      <KdsOrderBlock
        order={orderFirst}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const { container: middleContainer } = render(
      <KdsOrderBlock
        order={orderMiddle}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    expect(firstContainer.querySelector('.order-header')).toBeTruthy();
    expect(middleContainer.querySelector('.order-header')).toBeNull();
  });

  test('shows footer buttons only for last block', () => {
    const orderLast = createMockOrder({ 
      status: 'pending',
      isFirst: false, 
      isLast: true 
    });
    
    const orderMiddle = createMockOrder({ 
      status: 'pending',
      isFirst: false, 
      isLast: false 
    });

    const { container: lastContainer } = render(
      <KdsOrderBlock
        order={orderLast}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const { container: middleContainer } = render(
      <KdsOrderBlock
        order={orderMiddle}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    expect(lastContainer.querySelector('.order-footer')).toBeTruthy();
    expect(middleContainer.querySelector('.order-footer')).toBeNull();
  });

  test('handles item checkbox toggle', () => {
    const order = createMockOrder({ isFirst: true, isLast: true });

    const { container } = render(
      <KdsOrderBlock
        order={order}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeTruthy();

    if (checkbox) {
      fireEvent.click(checkbox);
      expect(mockHandleItemToggle).toHaveBeenCalledWith(1, 'ready', 1);
    }
  });

  test('handles order status button click', () => {
    const order = createMockOrder({ 
      status: 'pending',
      isFirst: true, 
      isLast: true 
    });

    const { container } = render(
      <KdsOrderBlock
        order={order}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const readyButton = container.querySelector('.all-ready-button');
    expect(readyButton).toBeTruthy();

    if (readyButton) {
      fireEvent.click(readyButton);
      expect(mockHandleOrderStatus).toHaveBeenCalledWith(1, 'ready');
    }
  });

  test('displays different buttons based on order status', () => {
    const pendingOrder = createMockOrder({ 
      status: 'pending', 
      isFirst: true, 
      isLast: true 
    });
    
    const readyOrder = createMockOrder({ 
      status: 'ready', 
      isFirst: true, 
      isLast: true 
    });
    
    const fulfilledOrder = createMockOrder({ 
      status: 'fulfilled', 
      isFirst: true, 
      isLast: true 
    });

    const { container: pendingContainer } = render(
      <KdsOrderBlock
        order={pendingOrder}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const { container: readyContainer } = render(
      <KdsOrderBlock
        order={readyOrder}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="pickup"
      />
    );

    const { container: fulfilledContainer } = render(
      <KdsOrderBlock
        order={fulfilledOrder}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="recall"
      />
    );

    expect(pendingContainer.textContent).toContain('Mark Ready');
    expect(readyContainer.textContent).toContain('Mark Fulfilled');
    expect(fulfilledContainer.textContent).toContain('Reverse');
  });

  test('applies correct CSS classes based on order state', () => {
    const firstOrder = createMockOrder({ 
      status: 'pending',
      isFirst: true, 
      isLast: false 
    });
    
    const middleOrder = createMockOrder({ 
      status: 'ready',
      isFirst: false, 
      isLast: false 
    });
    
    const lastOrder = createMockOrder({ 
      status: 'fulfilled',
      isFirst: false, 
      isLast: true 
    });

    const { container: firstContainer } = render(
      <KdsOrderBlock
        order={firstOrder}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const { container: middleContainer } = render(
      <KdsOrderBlock
        order={middleOrder}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const { container: lastContainer } = render(
      <KdsOrderBlock
        order={lastOrder}
        handleOrderStatus={mockHandleOrderStatus}
        handleItemToggle={mockHandleItemToggle}
        restoreOrder={mockRestoreOrder}
        mode="kitchen"
      />
    );

    const firstBlock = firstContainer.querySelector('.kds-order');
    const middleBlock = middleContainer.querySelector('.kds-order');
    const lastBlock = lastContainer.querySelector('.kds-order');

    expect(firstBlock).toHaveClass('pending', 'first');
    expect(middleBlock).toHaveClass('ready', 'middle');
    expect(lastBlock).toHaveClass('fulfilled', 'last');
  });

  // TODO: Add tests for:
  // - Long press detection and timing
  // - Touch vs mouse interaction handling  
  // - Keyboard shortcuts (double-tap numbers)
  // - Time calculation and formatting
  // - Special instruction parsing and display
});