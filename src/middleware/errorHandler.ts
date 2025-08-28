import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface ErrorWithStatus extends Error {
  status?: number;
}

export function errorHandler(error: Error, c: Context) {
  let status = 500;
  let message = 'Internal server error';

  if (error instanceof HTTPException) {
    status = error.status;
    message = error.message;
  } else if (error instanceof Error) {
    const errorWithStatus = error as ErrorWithStatus;
    status = errorWithStatus.status || 500;
    message = error.message || 'Internal server error';
  }

  console.error('API Error:', {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: c.req.url,
    method: c.req.method,
  });

  return c.json({
    error: 'Request failed',
    message,
    ...(Deno.env.get('NODE_ENV') === 'development' && {
      stack: error instanceof Error ? error.stack : undefined,
      details: error instanceof Error ? error.message : String(error)
    })
  }, status as any);
}