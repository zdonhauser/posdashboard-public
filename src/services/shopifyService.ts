/**
 * Shopify Service
 * Business logic for Shopify API operations
 */

import { shopifyConfig } from '@config/shopify';
import { env } from '@config/environment';

const shopifyToken = shopifyConfig.accessToken;
const SEAL_TOKEN = env.seal.token;
const SHOPIFY_DOMAIN = 'https://zdts-amusement-park.myshopify.com';
const SHOPIFY_GRAPHQL_ENDPOINT = `${SHOPIFY_DOMAIN}/admin/api/graphql.json`;
const SHOPIFY_GRAPHQL_2023_ENDPOINT = `${SHOPIFY_DOMAIN}/admin/api/2023-10/graphql.json`;
const SHOPIFY_GRAPHQL_UNSTABLE_ENDPOINT = `${SHOPIFY_DOMAIN}/admin/api/unstable/graphql.json`;

/**
 * Get subscription details from SEAL API
 */
export async function getSubscriptionDetails(subId: string): Promise<any> {
  const response = await fetch(
    `https://app.sealsubscriptions.com/shopify/merchant/api/subscription?id=${subId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Seal-Token': SEAL_TOKEN,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch subscription details');
  }

  return response.json();
}

/**
 * Get shop information from Shopify
 */
export async function getShopInfo(): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `{
        shop {
          name
          url
          email
          myshopifyDomain
        }
      }`,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shop info');
  }

  return response.json();
}

/**
 * Search Shopify products by query
 */
export async function searchProducts(searchQuery: string): Promise<any> {
  const query = `
    {
      products(first: 20, query: "${searchQuery.replace(/"/g, '\\"')}") {
        edges {
          node {
            id
            title
            handle
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error('Failed to search products');
  }

  const json = await response.json();
  const results = json?.data?.products?.edges?.map(({ node }: any) => ({
    id: node.id,
    title: node.title,
    handle: node.handle,
    variants: node.variants.edges.map(({ node: variant }: any) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      price: variant.price,
    })),
  }));

  return results;
}

/**
 * Create a new Shopify product
 */
export async function createShopifyItem(
  title: string,
  price: number,
  sku?: string,
  vendor?: string
): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_2023_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `
        mutation productCreate($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    sku
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          title,
          vendor,
          variants: [
            {
              price: price.toFixed(2),
              sku: sku || undefined,
            },
          ],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Shopify product');
  }

  const result = await response.json();
  const errors = result.data?.productCreate?.userErrors;

  if (errors && errors.length > 0) {
    throw new Error(errors.map((e: any) => e.message).join(', '));
  }

  const product = result.data.productCreate.product;
  const variant = product.variants.edges[0].node;

  return {
    line_item_id: product.id,
    variant_id: variant.id,
  };
}

/**
 * Get metafields by namespace
 */
export async function getMetafields(namespace: string): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `query($query:String!,$num:Int!){
        shop{
          metafields(namespace:$query, first:$num) {
            edges {
              node {
                key
                namespace
                value
              }
            }
          }
        }
      }`,
      variables: { query: namespace, num: 10 },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch metafields');
  }

  return response.json();
}

/**
 * Search product variants by SKU
 */
export async function searchVariantsBySku(sku: string): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `query findVariants($query: String!, $num: Int!) {
        productVariants(first: $num, query: $query) {
          edges {
            node {
              id
              sku
              inventoryQuantity
              product {
                title
                id
              }
              inventoryItem{
                id
                inventoryLevels(first:1){
                  edges{
                    node{
                      id
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      variables: { query: `${sku} OR TODAY OR ANYDAY`, num: 20 },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to search variants');
  }

  return response.json();
}

/**
 * Search items by PLU number
 */
export async function searchItems(term: string): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `query findItems($query: String!, $num: Int!) {
        items(first: $num, query: $query) {
          edges {
            node {
              id
              name
              pluNumber
              inventory {
                quantity
                location
              }
            }
          }
        }
      }`,
      variables: { query: `pluNumber:*${term}*`, num: 10 },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to search items');
  }

  return response.json();
}

/**
 * Update inventory quantity (set to specific value)
 */
export async function updateInventory(
  variantId: string,
  quantity: number
): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_UNSTABLE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `
        mutation InventorySet($input: InventorySetQuantitiesInput!) {
          inventorySetQuantities(input: $input) {
            inventoryAdjustmentGroup {
              createdAt
              reason
              changes {
                name
                delta
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          name: 'available',
          reason: 'correction',
          ignoreCompareQuantity: true,
          quantities: [
            {
              inventoryItemId: variantId,
              locationId: 'gid://shopify/Location/16306929777',
              quantity: quantity,
            },
          ],
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update inventory');
  }

  return response.json();
}

/**
 * Delete a product variant
 */
export async function deleteVariant(variantId: string): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `
        mutation deleteProductVariant($id: ID!) {
          productVariantDelete(id: $id) {
            deletedProductVariantId
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        id: variantId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete variant');
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }

  return data;
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `
        mutation deleteProduct($id: ID!) {
          productDelete(input: { id: $id }) {
            deletedProductId
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        id: productId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete product');
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }

  return data;
}

/**
 * Fetch products by collection
 */
export async function fetchProductsByCollection(collection: string): Promise<any> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': shopifyToken,
    },
    body: JSON.stringify({
      query: `query fetchVariants($collection: String!, $num: Int!) {
        products(first: $num, query: $collection) {
          edges {
            node {
              title
              variants(first: 4) {
                edges {
                  node {
                    id
                    title
                    sku
                    price
                  }
                }
              }
            }
          }
        }
      }`,
      variables: { collection, num: 25 },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products by collection');
  }

  const data = await response.json();

  // Transform the response to match the format expected by frontend
  const variants = data.data.products.edges.flatMap((edge: any) =>
    edge.node.variants.edges.map((variantEdge: any) => {
      const variant = variantEdge.node;
      return {
        title: edge.node.title,
        sku: variant.sku,
        originalUnitPrice: parseFloat(variant.price),
        quantity: 1,
        isTaxable: true,
      };
    })
  );

  return variants;
}

/**
 * Adjust inventory (delta adjustment using REST API)
 */
export async function adjustInventory(
  variantId: string,
  adjustment: number
): Promise<any> {
  // First, fetch the inventory item ID using the variant ID
  const variantResponse = await fetch(
    `${SHOPIFY_DOMAIN}/admin/api/2024-04/variants/${variantId}.json`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
    }
  );

  if (!variantResponse.ok) {
    throw new Error('Failed to fetch variant');
  }

  const variantData = await variantResponse.json();

  if (!variantData.variant || !variantData.variant.inventory_item_id) {
    throw new Error('Variant not found or missing inventory item ID.');
  }

  const inventoryItemId = variantData.variant.inventory_item_id;

  // Fetch inventory levels to find the location ID for the inventory item
  const levelsResponse = await fetch(
    `${SHOPIFY_DOMAIN}/admin/api/2024-04/inventory_levels.json?inventory_item_ids=${inventoryItemId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
    }
  );

  if (!levelsResponse.ok) {
    throw new Error('Failed to fetch inventory levels');
  }

  const levelsData = await levelsResponse.json();

  if (!levelsData.inventory_levels || levelsData.inventory_levels.length === 0) {
    throw new Error('Inventory levels not found for the given inventory item ID.');
  }

  // Assume the first location is the one we want to adjust
  const locationId = levelsData.inventory_levels[0].location_id;

  // Adjust the inventory with the retrieved inventory item ID and location ID
  const adjustResponse = await fetch(
    `${SHOPIFY_DOMAIN}/admin/api/2024-04/inventory_levels/adjust.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
      body: JSON.stringify({
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available_adjustment: adjustment,
      }),
    }
  );

  if (!adjustResponse.ok) {
    throw new Error('Failed to adjust inventory');
  }

  const adjustData = await adjustResponse.json();

  if (adjustData.errors) {
    throw new Error(JSON.stringify(adjustData.errors));
  }

  return adjustData;
}
