import { Request, Response, NextFunction } from 'express';

interface ErrorWithStatus extends Error {
  status?: number;
}

export function errorHandler(
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
): void {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query
  });

  const status = error.status || 500;
  const message = error.message || 'Internal server error';

  res.status(status).json({
    error: 'Request failed',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message
    })
  });
}