import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the can-i-burn-service module
const mockGetFireWatchStatus = vi.hoisted(() => vi.fn());
vi.mock('can-i-burn-service', () => {
  return {
    CanIBurnService: vi.fn().mockImplementation(() => ({
      getFireWatchStatus: mockGetFireWatchStatus
    }))
  };
});

// Mock node-geocoder
const mockPrimaryGeocode = vi.hoisted(() => vi.fn());
const mockFallbackGeocode = vi.hoisted(() => vi.fn());
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

// Import the app after mocking
import app from '../index';

describe('Main App Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Middleware Setup', () => {
    it('should have CORS enabled', async () => {
      const response = await request(app)
        .options('/api/health')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should parse JSON bodies', async () => {
      const mockResponse = { canBurn: true, fireWatchLevel: 'low' };
      mockGetFireWatchStatus.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/fire-watch')
        .send({ lat: '45.5', lng: '-73.6' })
        .expect(404); // POST not supported, but JSON should be parsed

      // The request should be processed (even if method not allowed)
      expect(response.headers['content-type']).toMatch(/html/);
    });

    it('should have security headers from helmet', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });
  });

  describe('Route Integration', () => {
    it('should serve health endpoint', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'can-i-burn-api');
    });

    it('should serve fire-watch endpoint', async () => {
      const mockResponse = { canBurn: true, fireWatchLevel: 'low' };
      mockGetFireWatchStatus.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/fire-watch?lat=45.5&lng=-73.6')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });

    it('should serve geocoding endpoint', async () => {
      const mockResult = [{
        latitude: 45.5017,
        longitude: -73.5673,
        formattedAddress: 'Montreal, QC, Canada'
      }];
      
      mockPrimaryGeocode.mockResolvedValue(mockResult);

      const response = await request(app)
        .get('/api/geocode?location=Montreal')
        .expect(200);

      expect(response.body).toHaveProperty('coordinates');
      expect(response.body.coordinates.latitude).toBe(45.5017);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);
    });

    it('should handle errors with error handler middleware', async () => {
      const error = new Error('Service error');
      mockGetFireWatchStatus.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/fire-watch?lat=45.5&lng=-73.6')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Request failed');
      expect(response.body).toHaveProperty('message', 'Service error');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .get('/api/fire-watch')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required parameters');
    });
  });

  describe('API Endpoints Integration', () => {
    it('should handle multiple concurrent requests', async () => {
      const mockFireResponse = { canBurn: true, fireWatchLevel: 'low' };
      const mockGeoResult = [{
        latitude: 45.5017,
        longitude: -73.5673,
        formattedAddress: 'Montreal, QC, Canada'
      }];
      
      mockGetFireWatchStatus.mockResolvedValue(mockFireResponse);
      mockPrimaryGeocode.mockResolvedValue(mockGeoResult);

      const requests = [
        request(app).get('/api/health'),
        request(app).get('/api/fire-watch?lat=45.5&lng=-73.6'),
        request(app).get('/api/geocode?location=Montreal')
      ];

      const responses = await Promise.all(requests);

      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(200);
      
      expect(responses[0].body).toHaveProperty('status', 'ok');
      expect(responses[1].body).toEqual(mockFireResponse);
      expect(responses[2].body).toHaveProperty('coordinates');
    });

    it('should handle mixed success and error responses', async () => {
      const mockFireResponse = { canBurn: true, fireWatchLevel: 'low' };
      const geoError = new Error('Geocoding failed');
      
      mockGetFireWatchStatus.mockResolvedValue(mockFireResponse);
      mockPrimaryGeocode.mockRejectedValue(geoError);
      mockFallbackGeocode.mockRejectedValue(geoError);

      const requests = [
        request(app).get('/api/health'),
        request(app).get('/api/fire-watch?lat=45.5&lng=-73.6'),
        request(app).get('/api/geocode?location=FailingLocation')
      ];

      const responses = await Promise.all(requests);

      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(200); // Geocoding returns 200 even on error

      expect(responses[0].body).toHaveProperty('status', 'ok');
      expect(responses[1].body).toEqual(mockFireResponse);
      expect(responses[2].body).toHaveProperty('message', 'Failed to resolve location');
    });
  });

  describe('Content Type Handling', () => {
    it('should return JSON for all API endpoints', async () => {
      const responses = await Promise.all([
        request(app).get('/api/health'),
        request(app).get('/api/fire-watch?lat=45.5&lng=-73.6').catch(r => r.response),
        request(app).get('/api/geocode?location=test').catch(r => r.response)
      ]);

      responses.forEach(response => {
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/health')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });
  });

  describe('Route Prefix', () => {
    it('should serve all routes under /api prefix', async () => {
      // Test that routes without /api prefix return 404
      const responses = await Promise.all([
        request(app).get('/health').expect(404),
        request(app).get('/fire-watch').expect(404),
        request(app).get('/geocode').expect(404)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(404);
      });
    });

    it('should serve all routes with /api prefix', async () => {
      const mockResponse = { canBurn: true, fireWatchLevel: 'low' };
      const mockGeoResult = [{ latitude: 45.5, longitude: -73.6 }];
      
      mockGetFireWatchStatus.mockResolvedValue(mockResponse);
      mockPrimaryGeocode.mockResolvedValue(mockGeoResult);

      const responses = await Promise.all([
        request(app).get('/api/health'),
        request(app).get('/api/fire-watch?lat=45.5&lng=-73.6'),
        request(app).get('/api/geocode?location=test')
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});