import { Router, Status } from '@oak/oak';

const router = new Router();

// Geocoding service URLs
const LOCATIONIQ_API_KEY = Deno.env.get('LOCATIONIQ_API_KEY') || 'pk.8110f3d215501dbb70a6b51a5e34b661';
const LOCATIONIQ_BASE_URL = 'https://eu1.locationiq.com/v1/search.php';
const OSM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    country?: string;
    city?: string;
    state?: string;
  };
}

async function geocodeLocationIQ(location: string): Promise<GeocodeResult[]> {
  const url = new URL(LOCATIONIQ_BASE_URL);
  url.searchParams.set('key', LOCATIONIQ_API_KEY);
  url.searchParams.set('q', location);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'CanIBurnAPI/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`LocationIQ API error: ${response.status}`);
  }

  return await response.json();
}

async function geocodeOSM(location: string): Promise<GeocodeResult[]> {
  const url = new URL(OSM_BASE_URL);
  url.searchParams.set('q', location);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '1');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'CanIBurnAPI/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap API error: ${response.status}`);
  }

  return await response.json();
}

router.get('/api/geocode', async (ctx) => {
  try {
    const url = new URL(ctx.request.url);
    const location = url.searchParams.get('location');

    if (!location) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = {
        error: 'Missing required parameter',
        message: 'location query parameter is required'
      };
      return;
    }

    if (location.trim().length === 0) {
      ctx.response.status = Status.BadRequest;
      ctx.response.body = {
        error: 'Invalid location',
        message: 'location must be a non-empty string'
      };
      return;
    }

    // Use external geocoding service with fallback
    let results: GeocodeResult[] = [];
    try {
      // Try LocationIQ first
      results = await geocodeLocationIQ(location.trim());
    } catch (primaryError) {
      console.log('Primary geocoder (LocationIQ) failed, trying fallback:', (primaryError as Error).message);
      try {
        // Fallback to OpenStreetMap
        results = await geocodeOSM(location.trim());
      } catch (fallbackError) {
        throw fallbackError; // This will be caught by the outer catch block
      }
    }

    if (!results || results.length === 0) {
      ctx.response.body = {
        location: location.trim(),
        coordinates: null,
        message: 'Location could not be resolved'
      };
      return;
    }

    // Return the first (most relevant) result
    const result = results[0];
    
    if (result.lat && result.lon) {
      ctx.response.body = {
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
      };
    } else {
      ctx.response.body = {
        location: location.trim(),
        coordinates: null,
        message: 'Location found but coordinates unavailable'
      };
    }
  } catch (error) {
    // Log the error for debugging but don't expose internal details
    console.error('Geocoding error:', error);
    
    const requestUrl = new URL(ctx.request.url);
    ctx.response.body = {
      location: requestUrl.searchParams.get('location') || '',
      coordinates: null,
      message: 'Failed to resolve location'
    };
  }
});

export { router as geocodingRouter };