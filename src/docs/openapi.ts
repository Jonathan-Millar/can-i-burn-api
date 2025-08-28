import { Application, Router, Context } from '@oak/oak';
import { join } from '@std/path';

export function registerDocs(app: Application): void {
  // OpenAPI 3.0 specification for the Can I Burn API
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Can I Burn API',
      version: '1.0.0',
      description:
        'Interactive API documentation for Can I Burn. Use "Try it out" to call endpoints directly. All endpoints are prefixed with /api.',
      contact: {
        name: 'Can I Burn',
        url: 'https://github.com/Jonathan-Millar/can-i-burn-api'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      { url: '/', description: 'Root server (paths include /api)' },
      { url: 'http://localhost:3001', description: 'Local development (paths include /api)' }
    ],
    tags: [
      { name: 'Health', description: 'Service health check' },
      { name: 'Fire Watch', description: 'Fire restriction and burn status' },
      { name: 'Geocoding', description: 'Geocoding utilities' }
    ],
    components: {
      parameters: {
        Lat: {
          name: 'lat',
          in: 'query',
          required: true,
          description: 'Latitude (-90 to 90)',
          schema: { type: 'number', minimum: -90, maximum: 90 }
        },
        Lng: {
          name: 'lng',
          in: 'query',
          required: true,
          description: 'Longitude (-180 to 180)',
          schema: { type: 'number', minimum: -180, maximum: 180 }
        },
        Location: {
          name: 'location',
          in: 'query',
          required: true,
          description: 'Location name or address',
          schema: { type: 'string', minLength: 1 }
        }
      },
      schemas: {
        Coordinates: {
          type: 'object',
          properties: {
            latitude: { type: 'number', example: 45.5017 },
            longitude: { type: 'number', example: -73.5673 }
          },
          required: ['latitude', 'longitude']
        },
        FireWatchRestrictions: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['low', 'moderate', 'high', 'extreme'] },
            description: { type: 'string' }
          },
          required: ['level']
        },
        FireWatchResponse: {
          type: 'object',
          properties: {
            canBurn: { type: 'boolean', example: false },
            restrictions: { $ref: '#/components/schemas/FireWatchRestrictions' },
            coordinates: { $ref: '#/components/schemas/Coordinates' },
            timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' }
          },
          required: ['canBurn', 'coordinates', 'timestamp']
        },
        // Geocode responses can return coordinates or null and may include message in non-success cases
        GeocodeResponse: {
          type: 'object',
          properties: {
            location: { type: 'string', example: 'Montreal, Canada' },
            coordinates: {
              allOf: [{ $ref: '#/components/schemas/Coordinates' }],
              nullable: true
            },
            formattedAddress: { type: 'string', nullable: true, example: 'Montreal, QC, Canada' },
            country: { type: 'string', nullable: true, example: 'Canada' },
            city: { type: 'string', nullable: true, example: 'Montreal' },
            state: { type: 'string', nullable: true, example: 'Quebec' },
            source: { type: 'string', example: 'geocoding' },
            message: { type: 'string', nullable: true, example: 'Location could not be resolved' }
          },
          required: ['location']
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ok' },
            timestamp: { type: 'string', format: 'date-time' },
            service: { type: 'string', example: 'can-i-burn-api' }
          },
          required: ['status', 'timestamp', 'service']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid parameters' },
            message: { type: 'string', example: 'Both lat and lng query parameters are required' }
          },
          required: ['error', 'message']
        }
      }
    },
    paths: {
      '/api/health': {
        get: {
          operationId: 'getHealth',
          tags: ['Health'],
          summary: 'Health check',
          description: 'Returns service health information',
          responses: {
            '200': {
              description: 'Service is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' },
                  examples: {
                    default: {
                      value: {
                        status: 'ok',
                        timestamp: '2024-01-15T10:30:00.000Z',
                        service: 'can-i-burn-api'
                      }
                    }
                  }
                }
              }
            },
            '500': {
              description: 'Unexpected server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/fire-watch': {
        get: {
          operationId: 'getFireWatch',
          tags: ['Fire Watch'],
          summary: 'Get fire restriction and burn status',
          parameters: [{ $ref: '#/components/parameters/Lat' }, { $ref: '#/components/parameters/Lng' }],
          responses: {
            '200': {
              description: 'Fire watch status',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/FireWatchResponse' }
                }
              }
            },
            '400': {
              description: 'Invalid parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '500': {
              description: 'Unexpected server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/geocode': {
        get: {
          operationId: 'geocode',
          tags: ['Geocoding'],
          summary: 'Geocode a location name',
          parameters: [{ $ref: '#/components/parameters/Location' }],
          responses: {
            '200': {
              description: 'Geocoding result (coordinates may be null if not found)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GeocodeResponse' }
                }
              }
            },
            '400': {
              description: 'Invalid parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            },
            '500': {
              description: 'Unexpected server error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      }
    }
  } as const;

  const router = new Router();

  // Serve the OpenAPI JSON
  router.get('/openapi.json', (ctx: Context) => {
    ctx.response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    ctx.response.headers.set('X-Robots-Tag', 'noindex');
    ctx.response.headers.set('Content-Type', 'application/json');
    ctx.response.body = openApiSpec;
  });

  // Redirect root to docs for convenience
  router.get('/', (ctx: Context) => {
    ctx.response.redirect('/docs');
  });

  // Serve Swagger UI assets initializer (avoids inline scripts for CSP)
  router.get('/docs/swagger-initializer.js', (ctx: Context) => {
    ctx.response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    ctx.response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    ctx.response.headers.set('X-Robots-Tag', 'noindex');
    ctx.response.body = `window.ui = SwaggerUIBundle({
  url: '/openapi.json',
  dom_id: '#swagger-ui',
  deepLinking: true,
  displayRequestDuration: true,
  tryItOutEnabled: true,
  persistAuthorization: true,
  filter: true,
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 2
});`;
  });

  // Serve Swagger UI page using CDN (simpler for Deno)
  router.get('/docs', (ctx: Context) => {
    ctx.response.headers.set('Content-Type', 'text/html; charset=utf-8');
    ctx.response.headers.set('X-Robots-Tag', 'noindex');
    ctx.response.body = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Can I Burn API Docs</title>
    <link rel="alternate" type="application/json" href="/openapi.json" title="OpenAPI schema" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.27.1/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.27.1/swagger-ui-bundle.js"></script>
    <script src="/docs/swagger-initializer.js"></script>
  </body>
</html>`;
  });

  app.use(router.routes());
  app.use(router.allowedMethods());
}