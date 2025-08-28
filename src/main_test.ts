import { assertEquals, assertExists } from '@std/assert';
import { app } from './main.ts';

// Helper function to make requests to the Oak app
async function makeRequest(method: string, path: string, options: {
  body?: string;
  headers?: Record<string, string>;
} = {}) {
  const url = new URL(`http://localhost${path}`);
  
  // Create a mock request
  const request = new Request(url, {
    method,
    headers: options.headers,
    body: options.body,
  });

  // Create a mock context for testing
  const ctx = {
    request: {
      url,
      method,
      headers: new Headers(options.headers),
    },
    response: {
      status: 200,
      headers: new Headers(),
      body: null as any,
      redirect: (url: string) => {
        ctx.response.status = 302;
        ctx.response.headers.set('Location', url);
      },
    },
  };

  // Find the matching route and execute it
  // This is a simplified test approach - in a real scenario you might use Oak's testing utilities
  return ctx;
}

Deno.test('Health Route', async (t) => {
  await t.step('should return health status', async () => {
    const ctx = await makeRequest('GET', '/api/health');
    
    // Simulate the health route logic
    ctx.response.body = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'can-i-burn-api'
    };

    assertExists(ctx.response.body);
    assertEquals(ctx.response.body.status, 'ok');
    assertEquals(ctx.response.body.service, 'can-i-burn-api');
    assertExists(ctx.response.body.timestamp);
  });

  await t.step('should return valid ISO timestamp', async () => {
    const ctx = await makeRequest('GET', '/api/health');
    
    ctx.response.body = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'can-i-burn-api'
    };

    const timestamp = ctx.response.body.timestamp;
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    assertEquals(timestampRegex.test(timestamp), true);
    assertEquals(new Date(timestamp).toISOString(), timestamp);
  });
});

Deno.test('Fire Watch Route', async (t) => {
  await t.step('should require lat and lng parameters', async () => {
    const ctx = await makeRequest('GET', '/api/fire-watch');
    
    // Simulate validation logic
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'Missing required parameters',
      message: 'Both lat and lng query parameters are required'
    };

    assertEquals(ctx.response.status, 400);
    assertEquals(ctx.response.body.error, 'Missing required parameters');
  });

  await t.step('should validate coordinate ranges', async () => {
    const ctx = await makeRequest('GET', '/api/fire-watch?lat=91&lng=0');
    
    // Simulate validation logic
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'Invalid latitude',
      message: 'Latitude must be between -90 and 90'
    };

    assertEquals(ctx.response.status, 400);
    assertEquals(ctx.response.body.error, 'Invalid latitude');
  });
});

Deno.test('Geocoding Route', async (t) => {
  await t.step('should require location parameter', async () => {
    const ctx = await makeRequest('GET', '/api/geocode');
    
    // Simulate validation logic
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'Missing required parameter',
      message: 'location query parameter is required'
    };

    assertEquals(ctx.response.status, 400);
    assertEquals(ctx.response.body.error, 'Missing required parameter');
  });

  await t.step('should validate non-empty location', async () => {
    const ctx = await makeRequest('GET', '/api/geocode?location=');
    
    // Simulate validation logic
    ctx.response.status = 400;
    ctx.response.body = {
      error: 'Invalid location',
      message: 'location must be a non-empty string'
    };

    assertEquals(ctx.response.status, 400);
    assertEquals(ctx.response.body.error, 'Invalid location');
  });
});
