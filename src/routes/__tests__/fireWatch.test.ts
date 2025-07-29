import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Create mock function using vi.hoisted to ensure proper hoisting
const mockGetFireWatchStatus = vi.hoisted(() => vi.fn());

// Mock the can-i-burn-service module
vi.mock('can-i-burn-service', () => {
  return {
    CanIBurnService: vi.fn().mockImplementation(() => ({
      getFireWatchStatus: mockGetFireWatchStatus
    }))
  };
});

// Import after mocking
import { fireWatchRouter } from '../fireWatch';

const app = express();
app.use(express.json());
app.use('/api', fireWatchRouter);

// Add error handler for testing
app.use((error: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: 'Internal server error', message: error.message });
});

describe('FireWatch Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/fire-watch', () => {
    it('should return fire watch data for valid coordinates', async () => {
      const mockResponse = {
        canBurn: true,
        fireWatchLevel: 'low',
        coordinates: { latitude: 45.5, longitude: -73.6 }
      };
      
      mockGetFireWatchStatus.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/fire-watch?lat=45.5&lng=-73.6')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
      expect(mockGetFireWatchStatus).toHaveBeenCalledWith({
        latitude: 45.5,
        longitude: -73.6
      });
    });

    it('should return 400 when lat parameter is missing', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lng=-73.6')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required parameters',
        message: 'Both lat and lng query parameters are required'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when lng parameter is missing', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lat=45.5')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required parameters',
        message: 'Both lat and lng query parameters are required'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when both parameters are missing', async () => {
      const response = await request(app)
        .get('/api/fire-watch')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required parameters',
        message: 'Both lat and lng query parameters are required'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when lat is not a valid number', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lat=invalid&lng=-73.6')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid coordinates',
        message: 'lat and lng must be valid numbers'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when lng is not a valid number', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lat=45.5&lng=invalid')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid coordinates',
        message: 'lat and lng must be valid numbers'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when latitude is below -90', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lat=-91&lng=-73.6')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid latitude',
        message: 'Latitude must be between -90 and 90'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when latitude is above 90', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lat=91&lng=-73.6')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid latitude',
        message: 'Latitude must be between -90 and 90'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when longitude is below -180', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lat=45.5&lng=-181')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid longitude',
        message: 'Longitude must be between -180 and 180'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should return 400 when longitude is above 180', async () => {
      const response = await request(app)
        .get('/api/fire-watch?lat=45.5&lng=181')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Invalid longitude',
        message: 'Longitude must be between -180 and 180'
      });
      expect(mockGetFireWatchStatus).not.toHaveBeenCalled();
    });

    it('should accept latitude at boundary values -90 and 90', async () => {
      const mockResponse = { canBurn: false, fireWatchLevel: 'high' };
      mockGetFireWatchStatus.mockResolvedValue(mockResponse);

      // Test -90
      await request(app)
        .get('/api/fire-watch?lat=-90&lng=0')
        .expect(200);

      // Test 90
      await request(app)
        .get('/api/fire-watch?lat=90&lng=0')
        .expect(200);

      expect(mockGetFireWatchStatus).toHaveBeenCalledTimes(2);
    });

    it('should accept longitude at boundary values -180 and 180', async () => {
      const mockResponse = { canBurn: false, fireWatchLevel: 'high' };
      mockGetFireWatchStatus.mockResolvedValue(mockResponse);

      // Test -180
      await request(app)
        .get('/api/fire-watch?lat=0&lng=-180')
        .expect(200);

      // Test 180
      await request(app)
        .get('/api/fire-watch?lat=0&lng=180')
        .expect(200);

      expect(mockGetFireWatchStatus).toHaveBeenCalledTimes(2);
    });

    it('should handle service errors and pass them to error handler', async () => {
      const error = new Error('Service unavailable');
      mockGetFireWatchStatus.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/fire-watch?lat=45.5&lng=-73.6')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
        message: 'Service unavailable'
      });
      expect(mockGetFireWatchStatus).toHaveBeenCalledWith({
        latitude: 45.5,
        longitude: -73.6
      });
    });

    it('should handle decimal coordinates correctly', async () => {
      const mockResponse = { canBurn: true, fireWatchLevel: 'low' };
      mockGetFireWatchStatus.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/api/fire-watch?lat=45.123456&lng=-73.987654')
        .expect(200);

      expect(mockGetFireWatchStatus).toHaveBeenCalledWith({
        latitude: 45.123456,
        longitude: -73.987654
      });
    });
  });
});