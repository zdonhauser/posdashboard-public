/**
 * Order Service
 * Handles all order and fulfillment-related business logic and Shopify API operations
 */

import fetch from 'node-fetch';
import { shopifyConfig } from '@config/shopify';

const shopName = shopifyConfig.shopName;
const shopifyToken = shopifyConfig.accessToken;
const SHOPIFY_GRAPHQL_URL = `https://${shopName}.myshopify.com/admin/api/graphql.json`;
const SHOPIFY_REST_BASE = `https://${shopName}.myshopify.com/admin/api`;

/**
 * Get orders by IDs from Shopify
 */
export async function getOrdersByIds(orderIds: string[]): Promise<any> {
  const idsString = orderIds.join(',');
  const shopUrl = `${SHOPIFY_REST_BASE}/2023-10/orders.json?limit=250&ids=${idsString}&status=any`;

  const response = await fetch(shopUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Server response: ${response.status}`);
  }

  return response.json();
}

/**
 * Search orders by query term using GraphQL
 */
export async function searchOrders(
  term: string,
  num: number = 10,
  items: number = 10,
  sortKey: string = 'CREATED_AT'
): Promise<any> {
  const query = `query findOrders($query: String!, $num: Int!, $items: Int!, $sortKey: OrderSortKeys!) {
    orders(first: $num, reverse:true, query: $query, sortKey: $sortKey) {
      edges {
        node {
          customer {
            displayName
          }
          id
          tags
          name
          fulfillable
          fulfillments {
            id
            status
            fulfillmentLineItems(first: $items){
              edges{
                node{
                  lineItem{
                    title
                    id
                  }
                  quantity
                }
              }
            }
          }
          lineItems(first: $items){
            edges{
              node{
                id
                title
                sku
                variantTitle
                quantity
                unfulfilledQuantity
                fulfillableQuantity
                nonFulfillableQuantity
                refundableQuantity
              }
            }
          }
        }
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: { query: term, num, items, sortKey },
    }),
  });

  return response.json();
}

/**
 * Search order IDs by query term
 */
export async function searchOrderIds(
  term: string,
  num: number = 250,
  sortKey: string = 'CREATED_AT'
): Promise<any> {
  const query = `
    query findOrders($query: String!, $num: Int!, $sortKey: OrderSortKeys!) {
      orders(first: $num, reverse:true, query: $query, sortKey: $sortKey) {
        edges {
          node {
            id
          }
          cursor
        }
        pageInfo{
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: { query: term, num, sortKey },
    }),
  });

  return response.json();
}

/**
 * Search fulfillment orders
 */
export async function searchFulfillmentOrders(params: {
  term: string;
  num?: number;
  items?: number;
  cursor?: string;
  forward?: boolean;
  fulfillmentItems?: number;
  lineItems?: number;
}): Promise<any> {
  const {
    term,
    num = 10,
    items = 5,
    cursor,
    forward,
    fulfillmentItems = 5,
    lineItems = 5,
  } = params;

  const query = `query findOrders($query: String!, $num: Int!, $items: Int!, $sortKey: OrderSortKeys!, $cursor: String = null,$forward: Boolean = true, $fulfillmentItems: Int!, $lineItems: Int!) {
    orders(first: $num, reverse:$forward, query: $query, sortKey: $sortKey, after:$cursor) {
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          fulfillmentOrders(first: $items, reverse: true){
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges{
              node{
                id
                status
                fulfillments(first:$fulfillmentItems){
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                  }
                  edges{
                    node{
                      id
                      displayStatus
                    }
                  }
                }
                lineItems(first: $lineItems){
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                  }
                  edges{
                    node{
                      id
                      remainingQuantity
                      totalQuantity
                      lineItem{
                        id
                        title
                        sku
                        variantTitle
                        nonFulfillableQuantity
                        customAttributes {
                          key
                          value
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          customer {
            displayName
          }
          billingAddress{
            address1
            address2
            city
            province
            country
            zip
          }
          id
          name
          note
          hasTimelineComment
          tags
          fulfillable
          customAttributes {
            key
            value
          }
        }
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: {
        query: term,
        num,
        items,
        sortKey: 'CREATED_AT',
        cursor,
        forward,
        fulfillmentItems,
        lineItems,
      },
    }),
  });

  return response.json();
}

/**
 * Create a fulfillment using GraphQL (V1)
 */
export async function createFulfillment(input: any): Promise<any> {
  const query = `mutation fulfillmentCreate($input: FulfillmentInput!) {
    fulfillmentCreate(input: $input) {
      fulfillment {
        id
      }
      order {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({ query, variables: { input } }),
  });

  return response.json();
}

/**
 * Create a fulfillment using GraphQL (V2)
 */
export async function createFulfillmentV2(params: {
  lineItems: any[];
  notify: boolean;
}): Promise<any> {
  const { lineItems, notify } = params;

  const query = `mutation fulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
    fulfillmentCreateV2(fulfillment: $fulfillment) {
      fulfillment {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: {
        fulfillment: {
          lineItemsByFulfillmentOrder: lineItems,
          notifyCustomer: notify,
          originAddress: {
            address1: '1218 N Camp St',
            address2: '',
            city: 'Seguin',
            countryCode: 'US',
            provinceCode: 'TX',
            zip: '78155',
          },
          trackingInfo: {},
        },
      },
    }),
  });

  return response.json();
}

/**
 * Cancel an order using GraphQL
 */
export async function cancelOrder(params: {
  orderId: string;
  refund?: boolean;
  email?: boolean;
  restock?: boolean;
  reason?: string;
  staffNote?: string;
}): Promise<any> {
  const {
    orderId,
    refund = true,
    email = false,
    restock = true,
    reason = 'OTHER',
    staffNote,
  } = params;

  const mutation = `
    mutation orderCancel(
      $orderId: ID!,
      $notifyCustomer: Boolean!,
      $reason: OrderCancelReason!,
      $refund: Boolean!,
      $restock: Boolean!,
      $staffNote: String
    ) {
      orderCancel(
        orderId: $orderId,
        notifyCustomer: $notifyCustomer,
        reason: $reason,
        refund: $refund,
        restock: $restock,
        staffNote: $staffNote
      ) {
        job {
          id
          done
        }
        orderCancelUserErrors {
          field
          message
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    orderId,
    notifyCustomer: Boolean(email),
    reason: reason.toUpperCase(),
    refund,
    restock: Boolean(restock),
    staffNote: staffNote || null,
  };

  const response = await fetch(
    `${SHOPIFY_REST_BASE}/2025-04/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
      body: JSON.stringify({ query: mutation, variables }),
    }
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  if (Array.isArray(payload.errors) && payload.errors.length) {
    const msgs = payload.errors.map((e: any) => e.message).join('; ');
    throw new Error(`GraphQL errors: ${msgs}`);
  }

  if (!payload.data || !payload.data.orderCancel) {
    throw new Error(
      `Unexpected response shape, no data.orderCancel: ${JSON.stringify(payload)}`
    );
  }

  const userErrors = payload.data.orderCancel.orderCancelUserErrors || [];
  if (userErrors.length) {
    const msgs = userErrors.map((e: any) => `${e.field}: ${e.message}`).join('; ');
    throw new Error(`User errors: ${msgs}`);
  }

  return payload.data.orderCancel.job;
}

/**
 * Cancel a fulfillment
 */
export async function cancelFulfillment(fulId: string): Promise<any> {
  const query = `mutation fulfillmentCancel($id: ID!) {
    fulfillmentCancel(id: $id) {
      fulfillment {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: { id: fulId },
    }),
  });

  return response.json();
}

/**
 * Update an order
 */
export async function updateOrder(input: any): Promise<any> {
  const query = `mutation orderUpdate($input: OrderInput!) {
    orderUpdate(input: $input) {
      order {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: { input },
    }),
  });

  return response.json();
}

/**
 * Get party information by order ID
 */
export async function getPartyInfo(id: string): Promise<any> {
  const query = `query findOrders($query: String!, $num: Int!, $sortKey: OrderSortKeys!) {
    orders(first: $num, reverse:true, query: $query, sortKey: $sortKey) {
      edges {
        node {
          id
          createdAt
          totalReceivedSet{
            shopMoney{
              amount
            }
          }
          billingAddress {
            phone
          }
          customer {
            displayName
            firstName
            lastName
            email
            phone
          }
          name
          lineItems(first: $num){
            edges{
              node{
                originalTotalSet{
                  shopMoney{
                    amount
                  }
                }
                title
                variantTitle
                variant {
                  id
                }
                product {
                  id
                  title
                }
                id
                sku
                refundableQuantity
                customAttributes {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: { query: id, num: 5, sortKey: 'CREATED_AT' },
    }),
  });

  return response.json();
}

/**
 * Create a draft order
 */
export async function createDraftOrder(input: any): Promise<any> {
  const query = `mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({ query, variables: { input } }),
  });

  return response.json();
}

/**
 * Update a draft order
 */
export async function updateDraftOrder(params: {
  id: string;
  input: any;
}): Promise<any> {
  const { id, input } = params;

  const query = `mutation draftOrderUpdate($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({ query, variables: { input, id } }),
  });

  return response.json();
}

/**
 * Complete a draft order
 */
export async function completeDraftOrder(id: string): Promise<any> {
  const query = `mutation draftOrderComplete($id: ID!) {
    draftOrderComplete(id: $id) {
      draftOrder {
        id
        order {
          id
        }
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({ query, variables: { id } }),
  });

  return response.json();
}

/**
 * Create a refund (cancel line item)
 */
export async function createRefund(params: {
  orderId: string;
  lineItemId: string;
}): Promise<any> {
  const { orderId, lineItemId } = params;

  const query = `mutation refundCreate($input: RefundInput!) {
    refundCreate(input: $input) {
      order {
        id
      }
      refund {
        id
      }
      userErrors {
        field
        message
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: {
        input: {
          orderId,
          currency: 'USD',
          notify: false,
          note: 'party edited by Dashboard App',
          refundLineItems: {
            lineItemId,
            quantity: 1,
            restockType: 'CANCEL',
            locationId: 'gid://shopify/Location/16306929777',
          },
          transactions: {
            amount: 0,
            gateway: 'Manual',
            kind: 'CHANGE',
            orderId,
          },
        },
      },
    }),
  });

  return response.json();
}

/**
 * Create an order via REST API
 */
export async function createOrder(orderData: any): Promise<any> {
  const makeRequest = () => {
    return fetch(`${SHOPIFY_REST_BASE}/2024-01/orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
      body: JSON.stringify({ order: orderData }),
    });
  };

  try {
    const result = await makeRequest();
    return result.json();
  } catch (error: any) {
    console.error('First attempt failed:', error.message);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      const retryResult = await makeRequest();
      return retryResult.json();
    } catch (retryError: any) {
      console.error('Second attempt failed:', retryError.message);
      throw new Error(retryError.message);
    }
  }
}

/**
 * Update order note via REST API
 */
export async function updateOrderNote(params: {
  orderId: string;
  note: string;
}): Promise<any> {
  const { orderId, note } = params;

  const response = await fetch(
    `${SHOPIFY_REST_BASE}/2024-04/orders/${orderId}.json`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
      body: JSON.stringify({
        order: {
          id: orderId,
          note,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Error updating order: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search order by order ID with transactions
 */
export async function searchOrderById(orderId: string): Promise<any> {
  const orderIds = orderId.split(',');

  // Fetch orders details
  const ordersResponse = await fetch(
    `${SHOPIFY_REST_BASE}/2023-10/orders.json?status=any&ids=${orderId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
    }
  );
  const orderData = await ordersResponse.json();

  // Fetch transactions for each order
  const transactionsPromises = orderIds.map((id) =>
    fetch(
      `${SHOPIFY_REST_BASE}/2023-10/orders/${id}/transactions.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken,
        },
      }
    ).then((result) => result.json())
  );

  const transactionsResults = await Promise.all(transactionsPromises);

  // Add transactions to each order
  orderData.orders.forEach((order: any, index: number) => {
    order.transactions = transactionsResults[index].transactions;
  });

  return orderData;
}

/**
 * Get fulfillment orders by order ID
 */
export async function getFulfillmentOrders(orderId: string): Promise<any> {
  const response = await fetch(
    `${SHOPIFY_REST_BASE}/2023-04/orders/${orderId}/fulfillment_orders.json`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
    }
  );

  return response.json();
}

/**
 * Batch fulfill orders
 */
export async function batchFulfillOrders(params: {
  fulfillmentOrderIds: string[];
  notify: boolean;
  orderId: string;
}): Promise<any> {
  const { orderId } = params;
  const locationId = '16306929777';

  const response = await fetch(
    `${SHOPIFY_REST_BASE}/2021-01/orders/${orderId}/fulfillments.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
      body: JSON.stringify({ fulfillment: { location_id: locationId } }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify({
      message: 'Shopify API error',
      error: data,
      status: response.status,
    }));
  }

  return data;
}

/**
 * Get party dates (available party room products)
 */
export async function getPartyDates(): Promise<any> {
  const query = `query findProducts($query: String!, $num: Int!) {
    collections(first: 1, query: $query) {
      edges {
        cursor
        node {
          products(first:$num) {
            edges {
              node {
                id
                title
                handle
                totalInventory
                totalVariants
                variants(first: 1) {
                  edges {
                    node {
                      sku
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: { query: 'party rooms', num: 100 },
    }),
  });

  return response.json();
}

/**
 * Get party times for a specific date
 */
export async function getPartyTimes(date: string): Promise<any> {
  const query = `query findProducts($query: String!, $num: Int!) {
    products(first: $num, query: $query) {
      edges {
        cursor
        node {
          id
          title
          totalInventory
          variants(first:10) {
            edges {
              node {
                id
                title
                inventoryQuantity
                sku
                price
              }
            }
          }
        }
      }
    }
  }`;

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query,
      variables: { query: date, num: 30 },
    }),
  });

  return response.json();
}
