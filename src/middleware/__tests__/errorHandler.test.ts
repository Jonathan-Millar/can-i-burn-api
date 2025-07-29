import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../errorHandler';

// Mock console.error to avoid noise in test output
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      url: '/test-url',
      method: 'GET',
      body: { test: 'data' },
      query: { param: 'value' }
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };
    
    mockNext = vi.fn();
  });

  it('should handle error with default status 500', () => {
    const error = new Error('Test error message');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Test error message'
    });
  });

  it('should handle error with custom status', () => {
    const error = new Error('Bad request') as any;
    error.status = 400;
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Bad request'
    });
  });

  it('should log error details to console', () => {
    const error = new Error('Test error');
    error.stack = 'Error stack trace';
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockConsoleError).toHaveBeenCalledWith('API Error:', {
      message: 'Test error',
      stack: 'Error stack trace',
      url: '/test-url',
      method: 'GET',
      body: { test: 'data' },
      query: { param: 'value' }
    });
  });

  it('should include stack trace and details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Development error');
    error.stack = 'Development stack trace';
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Development error',
      stack: 'Development stack trace',
      details: 'Development error'
    });
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not include stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Production error');
    error.stack = 'Production stack trace';
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Production error'
    });
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should handle error without stack trace', () => {
    const error = new Error('Error without stack');
    delete error.stack;
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockConsoleError).toHaveBeenCalledWith('API Error:', {
      message: 'Error without stack',
      stack: undefined,
      url: '/test-url',
      method: 'GET',
      body: { test: 'data' },
      query: { param: 'value' }
    });
  });

  it('should handle error with status 404', () => {
    const error = new Error('Not found') as any;
    error.status = 404;
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Not found'
    });
  });

  it('should handle error with status 401', () => {
    const error = new Error('Unauthorized') as any;
    error.status = 401;
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Unauthorized'
    });
  });

  it('should handle error with empty message', () => {
    const error = new Error('');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Internal server error'
    });
  });

  it('should handle error with undefined message', () => {
    const error = { message: undefined } as any;
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Internal server error'
    });
  });

  it('should handle request without body and query', () => {
    const error = new Error('Test error');
    const requestWithoutBodyQuery = {
      url: '/test',
      method: 'POST'
    } as Request;
    
    errorHandler(
      error,
      requestWithoutBodyQuery,
      mockResponse as Response,
      mockNext
    );

    expect(mockConsoleError).toHaveBeenCalledWith('API Error:', {
      message: 'Test error',
      stack: error.stack,
      url: '/test',
      method: 'POST',
      body: undefined,
      query: undefined
    });
  });

  it('should not call next function', () => {
    const error = new Error('Test error');
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle different NODE_ENV values', () => {
    const originalEnv = process.env.NODE_ENV;
    
    // Test with undefined NODE_ENV (should behave like production)
    delete process.env.NODE_ENV;
    
    const error = new Error('Undefined env error');
    error.stack = 'Stack trace';
    
    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    expect(mockJson).toHaveBeenCalledWith({
      error: 'Request failed',
      message: 'Undefined env error'
    });
    
    process.env.NODE_ENV = originalEnv;
  });
});