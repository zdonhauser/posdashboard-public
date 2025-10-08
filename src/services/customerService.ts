/**
 * Customer Service
 * Handles all customer-related business logic and Shopify API operations
 */

import fetch from 'node-fetch';
import { shopifyConfig } from '@config/shopify';

const shopName = shopifyConfig.shopName;
const shopifyToken = shopifyConfig.accessToken;
const SHOPIFY_GRAPHQL_URL = `https://${shopName}.myshopify.com/admin/api/2025-04/graphql.json`;
const SHOPIFY_REST_BASE = `https://${shopName}.myshopify.com/admin/api`;

/**
 * Search customers by query
 */
export async function searchCustomers(query: string, limit: number = 3): Promise<any> {
  const response = await fetch(
    `${SHOPIFY_REST_BASE}/2024-01/customers/search.json?query=${query}&limit=${limit}`,
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
 * Create a new Shopify customer
 */
export async function createCustomer(params: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<any> {
  const { firstName, lastName, email } = params;

  const query = `
    mutation createCustomer($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer {
          id
          firstName
          lastName
          email
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      firstName,
      lastName,
      email,
    },
  };

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Shopify customer: response not OK');
  }

  const data = await response.json();

  const userErrors = data?.data?.customerCreate?.userErrors;
  if (userErrors && userErrors.length > 0) {
    throw new Error(JSON.stringify({ errors: userErrors }));
  }

  const createdCustomer = data?.data?.customerCreate?.customer;
  if (!createdCustomer) {
    throw new Error('Shopify did not return the created customer.');
  }

  return {
    message: 'Shopify customer created successfully.',
    shopifyCustomer: createdCustomer,
  };
}

/**
 * Get customers by query using GraphQL
 */
export async function getCustomers(query: string): Promise<any> {
  const graphqlQuery = `
    query SearchCustomers($query: String!) {
      customers(first: 3, query: $query) {
        edges {
          node {
            id
            firstName
            lastName
            email
            phone
            storeCreditAccounts(first: 100) {
              edges {
                node {
                  balance {
                    amount
                    currencyCode
                  }
                }
              }
            }
            defaultAddress {
              address1
              address2
              city
              province
              provinceCode
              country
              countryCodeV2
              zip
              phone
              company
            }
            taxExempt
          }
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
      query: graphqlQuery,
      variables: { query },
    }),
  });

  return response.json();
}

/**
 * Get customer store credit by identifier (ID or email)
 */
export async function getCustomerStoreCredit(identifier: string): Promise<any> {
  const isNumericId = /^\d+$/.test(identifier);
  const isEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.toLowerCase()) && !isNumericId;

  let query, variables;

  if (isNumericId) {
    // Query by numeric Customer ID
    query = `
      query GetStoreCreditById($id: ID!) {
        customer(id: $id) {
          id
          email
          storeCreditAccounts(first: 1) {
            edges {
              node {
                id
                balance {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;
    variables = { id: `gid://shopify/Customer/${identifier}` };
  } else if (isEmail) {
    // Query by email
    query = `
      query GetStoreCreditByEmail($query: String!) {
        customers(first: 1, query: $query) {
          edges {
            node {
              id
              email
              storeCreditAccounts(first: 1) {
                edges {
                  node {
                    id
                    balance {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    variables = { query: `email:${identifier.toLowerCase()}` };
  } else {
    throw new Error('Invalid identifier. Must be numeric or a valid email.');
  }

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();

  let storeCreditAccount;
  let customerObj;

  if (isNumericId) {
    customerObj = data?.data?.customer;
    if (!customerObj) {
      throw new Error('No customer found with the provided numeric ID.');
    }
    storeCreditAccount = customerObj?.storeCreditAccounts?.edges?.[0]?.node;
  } else {
    const edge = data?.data?.customers?.edges?.[0];
    customerObj = edge?.node;
    if (!customerObj) {
      throw new Error('No customer found matching that email.');
    }
    if (customerObj.email?.toLowerCase() !== identifier.toLowerCase()) {
      throw new Error('No exact customer match for that email.');
    }
    storeCreditAccount = customerObj?.storeCreditAccounts?.edges?.[0]?.node;
  }

  // If the customer exists but has no store credit account
  if (!storeCreditAccount) {
    return {
      balance: '0',
      currencyCode: 'USD',
      id: customerObj.id,
    };
  }

  // If they DO have a store credit account
  return {
    balance: storeCreditAccount.balance.amount,
    currencyCode: storeCreditAccount.balance.currencyCode,
    id: storeCreditAccount.id,
  };
}

/**
 * Update customer store credit (credit or debit)
 */
export async function updateCustomerStoreCredit(params: {
  id: string;
  amount: number;
  currencyCode: string;
  type: 'credit' | 'debit';
}): Promise<any> {
  const { id, amount, currencyCode, type } = params;

  const mutation =
    type === 'credit'
      ? `
        mutation storeCreditAccountCredit($id: ID!, $creditInput: StoreCreditAccountCreditInput!) {
          storeCreditAccountCredit(id: $id, creditInput: $creditInput) {
            storeCreditAccountTransaction {
              amount {
                amount
                currencyCode
              }
              account {
                id
                balance {
                  amount
                  currencyCode
                }
              }
            }
            userErrors {
              message
              field
            }
          }
        }
      `
      : `
        mutation storeCreditAccountDebit($id: ID!, $debitInput: StoreCreditAccountDebitInput!) {
          storeCreditAccountDebit(id: $id, debitInput: $debitInput) {
            storeCreditAccountTransaction {
              amount {
                amount
                currencyCode
              }
              account {
                id
                balance {
                  amount
                  currencyCode
                }
              }
            }
            userErrors {
              message
              field
            }
          }
        }
      `;

  const inputKey = type === 'credit' ? 'creditInput' : 'debitInput';

  const response = await fetch(SHOPIFY_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        id,
        [inputKey]: {
          [`${type}Amount`]: {
            amount: amount.toString(),
            currencyCode,
          },
        },
      },
    }),
  });

  const data = await response.json();

  const responseData =
    data?.data?.storeCreditAccountCredit ?? data?.data?.storeCreditAccountDebit;

  if (responseData?.userErrors?.length) {
    throw new Error(JSON.stringify(responseData.userErrors));
  }

  const account = responseData?.storeCreditAccountTransaction?.account;
  return {
    balance: account?.balance,
    id: account?.id,
  };
}
