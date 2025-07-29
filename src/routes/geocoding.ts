import { Router, Request, Response, NextFunction } from 'express';
import NodeGeocoder from 'node-geocoder';

const router = Router();

// Initialize geocoder with multiple fallback providers
// Try LocationIQ first (more reliable), then OpenStreetMap as fallback
const primaryGeocoder = NodeGeocoder({
  provider: 'locationiq',
  formatter: null,
  apiKey: process.env.LOCATIONIQ_API_KEY || 'pk.8110f3d215501dbb70a6b51a5e34b661'
});

const fallbackGeocoder = NodeGeocoder({
  provider: 'openstreetmap',
  formatter: null
});


interface GeocodingQuery {
  location?: string;
}

router.get('/geocode', async (req: Request<object, object, object, GeocodingQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { location } = req.query;

    if (!location) {
      res.status(400).json({
        error: 'Missing required parameter',
        message: 'location query parameter is required'
      });
      return;
    }

    if (typeof location !== 'string' || location.trim().length === 0) {
      res.status(400).json({
        error: 'Invalid location',
        message: 'location must be a non-empty string'
      });
      return;
    }

    // Use external geocoding service with fallback
    let results;
    try {
      // Try LocationIQ first
      results = await primaryGeocoder.geocode(location.trim());
    } catch (primaryError) {
      console.log('Primary geocoder (LocationIQ) failed, trying fallback:', (primaryError as Error).message);
      try {
        // Fallback to OpenStreetMap
        results = await fallbackGeocoder.geocode(location.trim());
      } catch (fallbackError) {
        throw fallbackError; // This will be caught by the outer catch block
      }
    }

    if (!results || results.length === 0) {
      res.json({
        location: location.trim(),
        coordinates: null,
        message: 'Location could not be resolved'
      });
      return;
    }

    // Return the first (most relevant) result
    const result = results[0];
    
    if (result.latitude && result.longitude) {
      res.json({
        location: location.trim(),
        coordinates: {
          latitude: result.latitude,
          longitude: result.longitude
        },
        formattedAddress: result.formattedAddress || null,
        country: result.country || null,
        city: result.city || null,
        state: result.state || null,
        source: 'geocoding'
      });
    } else {
      res.json({
        location: location.trim(),
        coordinates: null,
        message: 'Location found but coordinates unavailable'
      });
    }
  } catch (error) {
    // Log the error for debugging but don't expose internal details
    console.error('Geocoding error:', error);
    
    res.json({
      location: req.query.location || '',
      coordinates: null,
      message: 'Failed to resolve location'
    });
  }
});

export { router as geocodingRouter };