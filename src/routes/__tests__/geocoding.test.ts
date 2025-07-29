import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create mock functions using vi.hoisted
const mockPrimaryGeocode = vi.hoisted(() => vi.fn());
const mockFallbackGeocode = vi.hoisted(() => vi.fn());

// Mock the node-geocoder module
vi.mock('node-geocoder', () => {
  return {
    default: vi.fn((config: any) => {
      if (config.provider === 'locationiq') {
        return { geocode: mockPrimaryGeocode };
      } else if (config.provider === 'openstreetmap') {
        return { geocode: mockFallbackGeocode };
      }
      return { geocode: vi.fn() };
    })
  };
});

// Import after mocking
import { geocodingRouter } from '../geocoding';

const app = express();
app.use(express.json());
app.use('/api', geocodingRouter);

describe('Geocoding Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/geocode', () => {
    it('should return coordinates for valid location using primary geocoder', async () => {
      const mockResult = [{
        latitude: 45.5017,
        longitude: -73.5673,
        formattedAddress: 'Montreal, QC, Canada',
        country: 'Canada',
        city: 'Montreal',
        state: 'Quebec'
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=Montreal')
        .expect(200);

      expect(response.body).toEqual({
        location: 'Montreal',
        coordinates: {
          latitude: 45.5017,
          longitude: -73.5673
        },
        formattedAddress: 'Montreal, QC, Canada',
        country: 'Canada',
        city: 'Montreal',
        state: 'Quebec',
        source: 'geocoding'
      });
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('Montreal');
      expect(mockFallbackGeocode).not.toHaveBeenCalled();
    });

    it('should fallback to secondary geocoder when primary fails', async () => {
      const primaryError = new Error('Primary geocoder failed');
      const mockResult = [{
        latitude: 45.5017,
        longitude: -73.5673,
        formattedAddress: 'Montreal, QC, Canada',
        country: 'Canada',
        city: 'Montreal',
        state: 'Quebec'
      }];
      
      mockPrimaryGeocode.mockRejectedValue(primaryError);
      mockFallbackGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=Montreal')
        .expect(200);

      expect(response.body).toEqual({
        location: 'Montreal',
        coordinates: {
          latitude: 45.5017,
          longitude: -73.5673
        },
        formattedAddress: 'Montreal, QC, Canada',
        country: 'Canada',
        city: 'Montreal',
        state: 'Quebec',
        source: 'geocoding'
      });
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('Montreal');
      expect(mockFallbackGeocode).toHaveBeenCalledWith('Montreal');
    });

    it('should return 400 when location parameter is missing', async () => {
      const response = await request(app)
        .get('/api/geocode')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required parameter',
        message: 'location query parameter is required'
      });
      expect(mockPrimaryGeocode).not.toHaveBeenCalled();
      expect(mockFallbackGeocode).not.toHaveBeenCalled();
    });

    it('should return 400 when location is empty string', async () => {
      const response = await request(app)
        .get('/api/geocode?location=')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required parameter',
        message: 'location query parameter is required'
      });
      expect(mockPrimaryGeocode).not.toHaveBeenCalled();
      expect(mockFallbackGeocode).not.toHaveBeenCalled();
    });

    it('should return 400 when location is only whitespace', async () => {
      const response = await request(app)
        .get('/api/geocode?location=%20%20%20')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid location',
        message: 'location must be a non-empty string'
      });
      expect(mockPrimaryGeocode).not.toHaveBeenCalled();
      expect(mockFallbackGeocode).not.toHaveBeenCalled();
    });

    it('should handle empty results from geocoder', async () => {
      mockPrimaryGeocode.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/geocode?location=NonexistentPlace')
        .expect(200);

      expect(response.body).toEqual({
        location: 'NonexistentPlace',
        coordinates: null,
        message: 'Location could not be resolved'
      });
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('NonexistentPlace');
    });

    it('should handle null results from geocoder', async () => {
      mockPrimaryGeocode.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/geocode?location=NonexistentPlace')
        .expect(200);

      expect(response.body).toEqual({
        location: 'NonexistentPlace',
        coordinates: null,
        message: 'Location could not be resolved'
      });
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('NonexistentPlace');
    });

    it('should handle results without coordinates', async () => {
      const mockResult = [{
        formattedAddress: 'Some Address',
        country: 'Canada'
        // No latitude/longitude
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=SomePlace')
        .expect(200);

      expect(response.body).toEqual({
        location: 'SomePlace',
        coordinates: null,
        message: 'Location found but coordinates unavailable'
      });
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('SomePlace');
    });

    it('should handle results with partial coordinates', async () => {
      const mockResult = [{
        latitude: 45.5017,
        // Missing longitude
        formattedAddress: 'Some Address'
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=SomePlace')
        .expect(200);

      expect(response.body).toEqual({
        location: 'SomePlace',
        coordinates: null,
        message: 'Location found but coordinates unavailable'
      });
    });

    it('should handle results with minimal data', async () => {
      const mockResult = [{
        latitude: 45.5017,
        longitude: -73.5673
        // No other fields
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=MinimalPlace')
        .expect(200);

      expect(response.body).toEqual({
        location: 'MinimalPlace',
        coordinates: {
          latitude: 45.5017,
          longitude: -73.5673
        },
        formattedAddress: null,
        country: null,
        city: null,
        state: null,
        source: 'geocoding'
      });
    });

    it('should trim whitespace from location parameter', async () => {
      const mockResult = [{
        latitude: 45.5017,
        longitude: -73.5673,
        formattedAddress: 'Montreal, QC, Canada'
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=%20%20Montreal%20%20')
        .expect(200);

      expect(response.body.location).toBe('Montreal');
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('Montreal');
    });

    it('should handle both geocoders failing gracefully', async () => {
      const primaryError = new Error('Primary failed');
      const fallbackError = new Error('Fallback failed');
      
      mockPrimaryGeocode.mockRejectedValue(primaryError);
      mockFallbackGeocode.mockRejectedValue(fallbackError);

      const response = await request(app)
        .get('/api/geocode?location=FailingPlace')
        .expect(200);

      expect(response.body).toEqual({
        location: 'FailingPlace',
        coordinates: null,
        message: 'Failed to resolve location'
      });
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('FailingPlace');
      expect(mockFallbackGeocode).toHaveBeenCalledWith('FailingPlace');
    });

    it('should handle special characters in location', async () => {
      const mockResult = [{
        latitude: 48.8566,
        longitude: 2.3522,
        formattedAddress: 'Paris, France'
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=Caf%C3%A9%20de%20Flore%2C%20Paris')
        .expect(200);

      expect(response.body.location).toBe('Café de Flore, Paris');
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('Café de Flore, Paris');
    });

    it('should handle numeric location strings', async () => {
      const mockResult = [{
        latitude: 40.7128,
        longitude: -74.0060,
        formattedAddress: '123 Main St, New York, NY'
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=123%20Main%20St')
        .expect(200);

      expect(response.body.location).toBe('123 Main St');
      expect(mockPrimaryGeocode).toHaveBeenCalledWith('123 Main St');
    });

    it('should handle very long location strings', async () => {
      const longLocation = 'A'.repeat(1000);
      const mockResult = [{
        latitude: 40.7128,
        longitude: -74.0060
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get(`/api/geocode?location=${longLocation}`)
        .expect(200);

      expect(response.body.location).toBe(longLocation);
      expect(mockPrimaryGeocode).toHaveBeenCalledWith(longLocation);
    });

  });

});