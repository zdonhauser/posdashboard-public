/**
 * Transaction Service
 * Handles business logic for transaction and tender operations
 */

import { queryDB } from "@config/database";
import { shopifyConfig } from "@config/shopify";

const shopifyToken = shopifyConfig.accessToken;
const SHOPIFY_DOMAIN = "https://zdts-amusement-park.myshopify.com";
const SHOPIFY_GRAPHQL_ENDPOINT = `${SHOPIFY_DOMAIN}/admin/api/graphql.json`;
const SHOPIFY_UNSTABLE_GRAPHQL = `${SHOPIFY_DOMAIN}/admin/api/unstable/graphql.json`;

/**
 * Fetch transactions from Shopify by email and date range
 */
export async function fetchTransactions(
  emails: string[],
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  // Build query string for emails and date range
  let emailQuery = emails.map((email) => `email:${email}`).join(" OR ");
  let query = `(${emailQuery})`; // Group email conditions

  if (startDate) {
    query += ` created_at:>=${startDate}`;
  }
  if (endDate) {
    query += ` created_at:<=${endDate}`;
  }

  // GraphQL query with pagination
  const graphqlQuery = `
    query GetTransactions($query: String!, $after: String) {
      orders(first: 50, query: $query, after: $after) {
        edges {
          cursor
          node {
            id
            email
            createdAt
            transactions(first: 10) {
              amountSet {
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
              gateway
              status
              kind
            }
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  let allTransactions: any[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  // Loop to fetch all pages of orders
  while (hasNextPage) {
    const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyToken,
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { query, after },
      }),
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error(JSON.stringify(data.errors));
    }

    const ordersData = data?.data?.orders;
    const orders = ordersData?.edges || [];

    // Extract transactions for the current page
    const transactions = orders.flatMap((edge: any) =>
      edge.node.transactions.map((transaction: any) => ({
        ...transaction,
        orderId: edge.node.id,
        email: edge.node.email,
        createdAt: edge.node.createdAt, // Order creation date
      }))
    );

    allTransactions = allTransactions.concat(transactions);

    // Check if there is another page and update the cursor for pagination
    hasNextPage = ordersData?.pageInfo?.hasNextPage;
    if (hasNextPage && orders.length > 0) {
      after = orders[orders.length - 1].cursor;
    }
  }

  return allTransactions;
}

/**
 * Get unsettled transactions from database
 */
export async function getUnsettledTransactions(): Promise<any[]> {
  const query = `
    SELECT *
    FROM transactions
    WHERE settled_on IS NULL AND (kind = 'capture' OR kind = 'sale' OR kind = 'refund' OR kind = 'change');
  `;
  const { rows } = await queryDB(query);
  const processedRows = rows.map((row) => ({
    ...row,
    amount:
      row.kind === "refund" || row.kind === "change"
        ? -Math.abs(row.amount)
        : row.amount,
  }));
  return processedRows;
}

/**
 * Get unsettled line items from database
 */
export async function getUnsettledItems(): Promise<any[]> {
  const query = `
    SELECT *
    FROM line_item_sales
    WHERE settled_on IS NULL;
  `;
  const { rows } = await queryDB(query);
  return rows;
}

/**
 * Settle transactions by ID
 */
export async function settleTransactions(transactionIds: string[]): Promise<any[]> {
  if (!transactionIds || !transactionIds.length) {
    return [];
  }

  const now = new Date();
  const query = `
    UPDATE transactions
    SET settled_on = $1
    WHERE id = ANY($2::bigint[])
    RETURNING *;
  `;
  const { rows } = await queryDB(query, [now, transactionIds]);
  return rows;
}

/**
 * Settle line items by ID
 */
export async function settleItems(itemIds: string[]): Promise<any[]> {
  if (!itemIds || !itemIds.length) {
    return [];
  }

  const now = new Date();
  const query = `
    UPDATE line_item_sales
    SET settled_on = $1
    WHERE id = ANY($2::bigint[])
    RETURNING *;
  `;
  const { rows } = await queryDB(query, [now, itemIds]);
  return rows;
}

/**
 * Fetch tender transactions from Shopify (POST version with reverse order)
 */
export async function fetchTenderTransactionsPost(
  startDate: string,
  endDate: string,
  num: number,
  cursor?: string
): Promise<any> {
  const term = `processed_at:>${startDate}T00:00:00-0500 AND processed_at:<${endDate}T00:00:00-0500`;
  let vbs: any = { query: term, num };
  if (cursor) {
    vbs.cursor = cursor;
  }

  const response = await fetch(SHOPIFY_UNSTABLE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shopifyToken,
    },
    body: JSON.stringify({
      query: `query($query:String!,$num:Int!${cursor ? `,$cursor:String!` : ``}){
        tenderTransactions(reverse:true,query:$query, first:$num ${
          cursor ? `after:$cursor` : ``
        }) {
          edges {
            cursor
            node {
              id
              processedAt
              amount{
                  amount
              }
              order {
                tags
                taxExempt
                customer {
                  displayName
                  email
                  taxExempt
                  defaultAddress {
                    company
                    formatted
                  }
                }
                return_items: metafield(namespace: "zdtpos", key: "return_items") {
                  key
                  value
                }
                refund_transactions: metafield(namespace: "zdtpos", key: "refund_transactions") {
                  key
                  value
                }
                taxLines {
                  priceSet{
                    shopMoney{
                      amount
                    }
                  }
                }
                refunds(first:30){
                  transactions(first:30){
                    edges{
                      node{
                        amountSet{
                          shopMoney{
                            amount
                          }
                        }
                      }
                    }
                  }
                  refundLineItems(first:30){
                    edges{
                      node{
                        id
                        lineItem {
                          title
                          id
                          vendor
                          taxable
                        }
                        quantity
                        priceSet{
                          shopMoney{
                            amount
                          }
                        }
                      }
                  }
                  }
                }
                transactions(first:200){
                  amountSet{
                    shopMoney{
                      amount
                    }
                  }
                  fees {
                    amount{
                      amount
                    }
                  }
                  formattedGateway
                  kind
                }
                lineItems(first:30){
                  edges{
                    node{
                      title
                      taxable
                      id
                      variantTitle
                      discountedUnitPriceSet{
                        shopMoney{
                          amount
                        }
                      }
                      quantity
                      refundableQuantity
                      vendor
                    }
                  }
                }
              }

            }
          }
          pageInfo{
            hasNextPage
          }
        }
    }
    `,
      variables: vbs,
    }),
  });

  return response.json();
}

/**
 * Fetch tender transactions from Shopify (GET version without reverse)
 */
export async function fetchTenderTransactionsGet(
  startDate: string,
  endDate: string,
  num: number,
  cursor?: string
): Promise<any> {
  const term = `processed_at:>${startDate}T00:00:00-0500 AND processed_at:<${endDate}T00:00:00-0500`;
  let vbs: any = { query: term, num };
  if (cursor) {
    vbs.cursor = cursor;
  }

  const response = await fetch(SHOPIFY_UNSTABLE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": shopifyToken,
    },
    body: JSON.stringify({
      query: `query($query:String!,$num:Int!${cursor ? `,$cursor:String!` : ``}){
        tenderTransactions(query:$query, first:$num ${
          cursor ? `after:$cursor` : ``
        }) {
          edges {
            cursor
            node {
              id
              processedAt
              amount{
                  amount
              }
              order {
                tags
                taxExempt
                customer {
                  displayName
                  email
                  taxExempt
                  defaultAddress {
                    company
                    formatted
                  }
                }
                return_items: metafield(namespace: "zdtpos", key: "return_items") {
                  key
                  value
                }
                refund_transactions: metafield(namespace: "zdtpos", key: "refund_transactions") {
                  key
                  value
                }
                taxLines {
                  priceSet{
                    shopMoney{
                      amount
                    }
                  }
                }
                refunds(first:30){
                  transactions(first:30){
                    edges{
                      node{
                        amountSet{
                          shopMoney{
                            amount
                          }
                        }
                      }
                    }
                  }
                  refundLineItems(first:30){
                    edges{
                      node{
                        id
                        lineItem {
                          title
                          id
                          vendor
                          taxable
                        }
                        quantity
                        priceSet{
                          shopMoney{
                            amount
                          }
                        }
                      }
                  }
                  }
                }
                transactions(first:200){
                  amountSet{
                    shopMoney{
                      amount
                    }
                  }
                  fees {
                    amount{
                      amount
                    }
                  }
                  formattedGateway
                  kind
                }
                lineItems(first:30){
                  edges{
                    node{
                      title
                      taxable
                      id
                      variantTitle
                      discountedUnitPriceSet{
                        shopMoney{
                          amount
                        }
                      }
                      quantity
                      refundableQuantity
                      vendor
                    }
                  }
                }
              }

            }
          }
          pageInfo{
            hasNextPage
          }
        }
    }
    `,
      variables: vbs,
    }),
  });

  return response.json();
}

/**
 * Fetch tender transaction count with retry on throttle
 */
export async function fetchTenderCount(
  startDate: string,
  endDate: string,
  num: number,
  cursor?: string
): Promise<any> {
  const term = `processed_at:>${startDate}T00:00:00-0500 AND processed_at:<${endDate}T00:00:00-0500`;
  const vbs: any = { query: term, num };
  if (cursor) {
    vbs.cursor = cursor;
  }

  const performFetch = async (retries = 3): Promise<any> => {
    const response = await fetch(SHOPIFY_UNSTABLE_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": shopifyToken,
      },
      body: JSON.stringify({
        query: `query($query:String!,$num:Int!${cursor ? `,$cursor:String!` : ``}){
          tenderTransactions(reverse:true,query:$query, first:$num ${
            cursor ? `after:$cursor` : ``
          }) {
            edges {
              node {
                id
                processedAt
                amount{
                  amount
                }
                order {
                  id
                }
              }
              cursor
            }
            pageInfo{
              hasNextPage
            }
          }
      }`,
        variables: vbs,
      }),
    });

    const data = await response.json();

    // Handle throttling with retry
    if (
      data.errors &&
      data.errors.some((e: any) => e.extensions.code === "THROTTLED") &&
      retries > 0
    ) {
      const requestedQueryCost = data.extensions.cost.requestedQueryCost;
      const currentlyAvailable =
        data.extensions.cost.throttleStatus.currentlyAvailable;
      const restoreRate = data.extensions.cost.throttleStatus.restoreRate;
      const waitTime =
        Math.ceil((requestedQueryCost - currentlyAvailable) / restoreRate) *
        1000;

      console.log(`Throttled! Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return performFetch(retries - 1);
    }

    return data;
  };

  return performFetch();
}
