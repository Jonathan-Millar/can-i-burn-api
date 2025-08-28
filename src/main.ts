import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from 'hono/logger';
import { securityHeaders } from './middleware/security.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { NBDNRService } from './services/nbdnrService.ts';

const app = new Hono();
const PORT = parseInt(Deno.env.get('PORT') || '3001');

// Logger middleware
app.use('*', logger());

// Pretty JSON formatting
app.use('*', prettyJSON());

// Security headers middleware
app.use('*', securityHeaders);

// CORS middleware
app.use('*', cors({
  origin: '*',
  credentials: true,
}));

// Health check endpoint
app.get('/api/health', (c: Context) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'can-i-burn-api'
  });
});

// Fire watch endpoint
const nbdnrService = new NBDNRService();

app.get('/api/fire-watch', async (c: Context) => {
  try {
    const lat = c.req.query('lat');
    const lng = c.req.query('lng');

    if (!lat || !lng) {
      return c.json({
        error: 'Missing required parameters',
        message: 'Both lat and lng query parameters are required'
      }, 400);
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return c.json({
        error: 'Invalid coordinates',
        message: 'lat and lng must be valid numbers'
      }, 400);
    }

    if (latitude < -90 || latitude > 90) {
      return c.json({
        error: 'Invalid latitude',
        message: 'Latitude must be between -90 and 90'
      }, 400);
    }

    if (longitude < -180 || longitude > 180) {
      return c.json({
        error: 'Invalid longitude',
        message: 'Longitude must be between -180 and 180'
      }, 400);
    }

    const coordinates = { latitude, longitude };
    const fireWatchResponse = await nbdnrService.getFireWatchStatus(coordinates);

    return c.json(fireWatchResponse);
  } catch (error) {
    throw error; // Will be handled by error handler middleware
  }
});

// Geocoding endpoint
app.get('/api/geocode', async (c: Context) => {
  try {
    const location = c.req.query('location');

    if (!location) {
      return c.json({
        error: 'Missing required parameter',
        message: 'location query parameter is required'
      }, 400);
    }

    if (location.trim().length === 0) {
      return c.json({
        error: 'Invalid location',
        message: 'location must be a non-empty string'
      }, 400);
    }

    // Use OpenStreetMap for geocoding
    const geocodeUrl = new URL('https://nominatim.openstreetmap.org/search');
    geocodeUrl.searchParams.set('q', location.trim());
    geocodeUrl.searchParams.set('format', 'json');
    geocodeUrl.searchParams.set('limit', '1');
    geocodeUrl.searchParams.set('addressdetails', '1');

    const response = await fetch(geocodeUrl.toString(), {
      headers: {
        'User-Agent': 'CanIBurnAPI/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      return c.json({
        location: location.trim(),
        coordinates: null,
        message: 'Location could not be resolved'
      });
    }

    const result = results[0];

    return c.json({
      location: location.trim(),
      coordinates: {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon)
      },
      formattedAddress: result.display_name || null,
      country: result.address?.country || null,
      city: result.address?.city || null,
      state: result.address?.state || null,
      source: 'geocoding'
    });

  } catch (error) {
    console.error('Geocoding error:', error);
    const location = c.req.query('location') || '';
    return c.json({
      location: location.trim(),
      coordinates: null,
      message: 'Failed to resolve location'
    });
  }
});

// OpenAPI documentation
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Can I Burn API',
    version: '1.0.0',
    description: 'REST API for fire restriction and burn status information',
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': { description: 'Service is healthy' }
        }
      }
    },
    '/api/fire-watch': {
      get: {
        summary: 'Get fire watch status',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } }
        ],
        responses: {
          '200': { description: 'Fire watch status' }
        }
      }
    },
    '/api/geocode': {
      get: {
        summary: 'Geocode location',
        parameters: [
          { name: 'location', in: 'query', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Geocoding result' }
        }
      }
    }
  }
};

// Documentation endpoints
app.get('/openapi.json', (c: Context) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  c.header('X-Robots-Tag', 'noindex');
  return c.json(openApiSpec);
});

app.get('/docs', (c: Context) => {
  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Can I Burn API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.27.1/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.27.1/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        filter: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2
      });
    </script>
  </body>
</html>`;
  
  c.header('X-Robots-Tag', 'noindex');
  return c.html(html);
});

// Root redirect to docs
app.get('/', (c: Context) => {
  return c.redirect('/docs');
});

// Global error handler
app.onError(errorHandler);

// Start server
if (import.meta.main) {
  console.log(`🔥 Can I Burn API (Hono) server running on port ${PORT}`);
  Deno.serve({ port: PORT }, app.fetch);
}

export default app;
