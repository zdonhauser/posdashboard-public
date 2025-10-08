/**
 * API test helpers
 *
 * Utilities for testing Express routes and endpoints.
 */

import request from 'supertest';
import { Express } from 'express';

/**
 * Create a test request helper bound to an Express app
 */
export function createTestRequest(app: Express) {
  return {
    get: (url: string) => request(app).get(url),
    post: (url: string, body?: any) => {
      const req = request(app).post(url);
      if (body) {
        req.send(body);
      }
      return req;
    },
    put: (url: string, body?: any) => {
      const req = request(app).put(url);
      if (body) {
        req.send(body);
      }
      return req;
    },
    patch: (url: string, body?: any) => {
      const req = request(app).patch(url);
      if (body) {
        req.send(body);
      }
      return req;
    },
    delete: (url: string) => request(app).delete(url),
  };
}

/**
 * Mock authentication for protected routes
 */
export function mockAuth(req: request.Test, token?: string) {
  if (token) {
    req.set('Authorization', `Bearer ${token}`);
  }
  return req;
}

/**
 * Expected response matchers for common scenarios
 */
export const expectResponse = {
  success: (response: request.Response) => {
    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  },

  created: (response: request.Response) => {
    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
  },

  badRequest: (response: request.Response) => {
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  },

  unauthorized: (response: request.Response) => {
    expect(response.status).toBe(401);
  },

  notFound: (response: request.Response) => {
    expect(response.status).toBe(404);
  },

  serverError: (response: request.Response) => {
    expect(response.status).toBe(500);
  },

  validationError: (response: request.Response, field?: string) => {
    expect(response.status).toBe(400);
    if (field) {
      expect(response.body.error).toContain(field);
    }
  },
};

/**
 * Wait for a condition to be true (useful for async operations)
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}
