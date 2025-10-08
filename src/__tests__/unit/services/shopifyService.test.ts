/**
 * Unit tests for Shopify Service
 */

import * as shopifyService from '../../../services/shopifyService';

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('Shopify Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionDetails', () => {
    it('should fetch subscription details from SEAL API', async () => {
      const mockData = { id: '123', status: 'active' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.getSubscriptionDetails('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('sealsubscriptions.com'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Seal-Token': expect.any(String),
          }),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error on failed fetch', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(shopifyService.getSubscriptionDetails('123')).rejects.toThrow(
        'Failed to fetch subscription details'
      );
    });
  });

  describe('getShopInfo', () => {
    it('should fetch shop information', async () => {
      const mockData = {
        data: {
          shop: {
            name: 'Test Shop',
            email: 'test@example.com',
          },
        },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.getShopInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('graphql.json'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-Shopify-Access-Token': expect.any(String),
          }),
        })
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockData = {
        data: {
          products: {
            edges: [
              {
                node: {
                  id: '1',
                  title: 'Test Product',
                  handle: 'test-product',
                  variants: {
                    edges: [
                      {
                        node: {
                          id: 'v1',
                          title: 'Default',
                          sku: 'TEST-SKU',
                          price: '10.00',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.searchProducts('test');

      expect(mockFetch).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Product');
      expect(result[0].variants).toHaveLength(1);
    });

    it('should escape quotes in search query', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { products: { edges: [] } } }),
      } as Response);

      await shopifyService.searchProducts('test"quote');

      const call = mockFetch.mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.query).toContain('\\"');
    });
  });

  describe('createShopifyItem', () => {
    it('should create a new product', async () => {
      const mockData = {
        data: {
          productCreate: {
            product: {
              id: 'p1',
              title: 'New Product',
              variants: {
                edges: [
                  {
                    node: {
                      id: 'v1',
                      price: '25.00',
                      sku: 'NEW-SKU',
                    },
                  },
                ],
              },
            },
            userErrors: [],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.createShopifyItem(
        'New Product',
        25.0,
        'NEW-SKU',
        'Test Vendor'
      );

      expect(result).toEqual({
        line_item_id: 'p1',
        variant_id: 'v1',
      });
    });

    it('should throw error when there are user errors', async () => {
      const mockData = {
        data: {
          productCreate: {
            userErrors: [{ field: 'title', message: 'Title is required' }],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      await expect(
        shopifyService.createShopifyItem('', 10, 'SKU')
      ).rejects.toThrow('Title is required');
    });
  });

  describe('getMetafields', () => {
    it('should fetch metafields by namespace', async () => {
      const mockData = {
        data: {
          shop: {
            metafields: {
              edges: [
                {
                  node: {
                    key: 'test_key',
                    namespace: 'test_namespace',
                    value: 'test_value',
                  },
                },
              ],
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.getMetafields('test_namespace');

      expect(result).toEqual(mockData);
    });
  });

  describe('searchVariantsBySku', () => {
    it('should search variants by SKU', async () => {
      const mockData = {
        data: {
          productVariants: {
            edges: [
              {
                node: {
                  id: 'v1',
                  sku: 'TEST-SKU',
                  inventoryQuantity: 10,
                  product: {
                    title: 'Test Product',
                    id: 'p1',
                  },
                },
              },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.searchVariantsBySku('TEST-SKU');

      expect(result).toEqual(mockData);
    });
  });

  describe('searchItems', () => {
    it('should search items by PLU number', async () => {
      const mockData = {
        data: {
          items: {
            edges: [
              {
                node: {
                  id: '1',
                  name: 'Test Item',
                  pluNumber: '12345',
                },
              },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.searchItems('12345');

      expect(result).toEqual(mockData);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory quantity', async () => {
      const mockData = {
        data: {
          inventorySetQuantities: {
            inventoryAdjustmentGroup: {
              createdAt: '2024-01-01',
              reason: 'correction',
              changes: [],
            },
            userErrors: [],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.updateInventory('inv-123', 50);

      expect(result).toEqual(mockData);
    });
  });

  describe('deleteVariant', () => {
    it('should delete a variant successfully', async () => {
      const mockData = {
        data: {
          productVariantDelete: {
            deletedProductVariantId: 'v1',
            userErrors: [],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.deleteVariant('v1');

      expect(result).toEqual(mockData);
    });

    it('should throw error on API errors', async () => {
      const mockData = {
        errors: [{ message: 'Variant not found' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      await expect(shopifyService.deleteVariant('v1')).rejects.toThrow();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product successfully', async () => {
      const mockData = {
        data: {
          productDelete: {
            deletedProductId: 'p1',
            userErrors: [],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.deleteProduct('p1');

      expect(result).toEqual(mockData);
    });
  });

  describe('fetchProductsByCollection', () => {
    it('should fetch products by collection', async () => {
      const mockData = {
        data: {
          products: {
            edges: [
              {
                node: {
                  title: 'Test Product',
                  variants: {
                    edges: [
                      {
                        node: {
                          id: 'v1',
                          title: 'Default',
                          sku: 'TEST-SKU',
                          price: '15.00',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await shopifyService.fetchProductsByCollection('test-collection');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Test Product');
      expect(result[0].sku).toBe('TEST-SKU');
      expect(result[0].originalUnitPrice).toBe(15.0);
    });
  });

  describe('adjustInventory', () => {
    it('should adjust inventory using REST API', async () => {
      // Mock variant fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          variant: {
            id: '123',
            inventory_item_id: 'inv-123',
          },
        }),
      } as Response);

      // Mock inventory levels fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          inventory_levels: [
            {
              location_id: 'loc-1',
              available: 10,
            },
          ],
        }),
      } as Response);

      // Mock inventory adjust
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          inventory_level: {
            available: 15,
          },
        }),
      } as Response);

      const result = await shopifyService.adjustInventory('123', 5);

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.inventory_level.available).toBe(15);
    });

    it('should throw error when variant not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ variant: null }),
      } as Response);

      await expect(shopifyService.adjustInventory('999', 5)).rejects.toThrow(
        'Variant not found or missing inventory item ID'
      );
    });

    it('should throw error when inventory levels not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          variant: { id: '123', inventory_item_id: 'inv-123' },
        }),
      } as Response);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ inventory_levels: [] }),
      } as Response);

      await expect(shopifyService.adjustInventory('123', 5)).rejects.toThrow(
        'Inventory levels not found'
      );
    });
  });
});
