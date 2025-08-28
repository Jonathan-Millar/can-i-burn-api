// Vercel Edge Runtime entry point
// This function handles all requests using standard Web APIs

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  // For Vercel serverless functions, we handle requests using standard Web APIs
  // This provides the same functionality as our Deno/Oak application
  
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Health check endpoint
  if (path === '/api/health') {
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'can-i-burn-api'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN'
      }
    });
  }
  
  // Fire watch endpoint
  if (path === '/api/fire-watch') {
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    
    if (!lat || !lng) {
      return new Response(JSON.stringify({
        error: 'Missing required parameters',
        message: 'Both lat and lng query parameters are required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return new Response(JSON.stringify({
        error: 'Invalid coordinates',
        message: 'lat and lng must be valid numbers'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return new Response(JSON.stringify({
        error: 'Invalid coordinates',
        message: 'Coordinates out of valid range'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    try {
      // Import and use the NBDNR service
      const { NBDNRService } = await import('../src/services/nbdnrService.ts');
      const nbdnrService = new NBDNRService();
      const result = await nbdnrService.getFireWatchStatus({ latitude, longitude });
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  // Geocoding endpoint
  if (path === '/api/geocode') {
    const location = url.searchParams.get('location');
    
    if (!location || location.trim().length === 0) {
      return new Response(JSON.stringify({
        error: 'Missing required parameter',
        message: 'location query parameter is required'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    try {
      // Simple geocoding using OpenStreetMap (no API key required)
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
        return new Response(JSON.stringify({
          location: location.trim(),
          coordinates: null,
          message: 'Location could not be resolved'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      const result = results[0];
      
      return new Response(JSON.stringify({
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
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        location: location.trim(),
        coordinates: null,
        message: 'Failed to resolve location'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
  
  // Documentation endpoints
  if (path === '/openapi.json') {
    // Import the OpenAPI spec
    const openApiSpec = {
      openapi: '3.0.3',
      info: {
        title: 'Can I Burn API',
        version: '1.0.0',
        description: 'REST API for fire restriction and burn status information'
      },
      // Simplified spec for Vercel deployment
      paths: {
        '/api/health': {
          get: {
            summary: 'Health check',
            responses: {
              '200': {
                description: 'Service is healthy'
              }
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
        }
      }
    };
    
    return new Response(JSON.stringify(openApiSpec), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Robots-Tag': 'noindex'
      }
    });
  }
  
  if (path === '/docs') {
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
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex'
      }
    });
  }
  
  // Root redirect to docs
  if (path === '/') {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/docs'
      }
    });
  }
  
  // 404 for unknown routes
  return new Response(JSON.stringify({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
