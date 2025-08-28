import { assertEquals, assertExists } from '@std/assert';
import app from './main.ts';

// Helper function to make requests to the Hono app
async function makeRequest(method: string, path: string, options: {
  body?: string;
  headers?: Record<string, string>;
} = {}): Promise<Response> {
  const url = `http://localhost${path}`;
  
  const request = new Request(url, {
    method,
    headers: options.headers,
    body: options.body,
  });

  // Use Hono's fetch method to handle the request
  return await app.fetch(request);
}

Deno.test('Health Route', async (t) => {
  await t.step('should return health status', async () => {
    const response = await makeRequest('GET', '/api/health');
    const body = await response.json();

    assertEquals(response.status, 200);
    assertExists(body);
    assertEquals(body.status, 'ok');
    assertEquals(body.service, 'can-i-burn-api');
    assertExists(body.timestamp);
  });

  await t.step('should return valid ISO timestamp', async () => {
    const response = await makeRequest('GET', '/api/health');
    const body = await response.json();

    const timestamp = body.timestamp;
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    assertEquals(timestampRegex.test(timestamp), true);
    assertEquals(new Date(timestamp).toISOString(), timestamp);
  });
});

Deno.test('Fire Watch Route', async (t) => {
  await t.step('should require lat and lng parameters', async () => {
    const response = await makeRequest('GET', '/api/fire-watch');
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.error, 'Missing required parameters');
  });

  await t.step('should validate coordinate ranges', async () => {
    const response = await makeRequest('GET', '/api/fire-watch?lat=91&lng=0');
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.error, 'Invalid latitude');
  });
});

Deno.test('Geocoding Route', async (t) => {
  await t.step('should require location parameter', async () => {
    const response = await makeRequest('GET', '/api/geocode');
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.error, 'Missing required parameter');
  });

  await t.step('should validate non-empty location', async () => {
    const response = await makeRequest('GET', '/api/geocode?location=');
    const body = await response.json();

    assertEquals(response.status, 400);
    assertEquals(body.error, 'Missing required parameter');
  });
});
