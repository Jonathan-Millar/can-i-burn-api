import { Context, Next, isHttpError, Status } from '@oak/oak';

interface ErrorWithStatus extends Error {
  status?: number;
}

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    let status = Status.InternalServerError;
    let message = 'Internal server error';

    if (isHttpError(error)) {
      status = error.status;
      message = error.message;
    } else if (error instanceof Error) {
      const errorWithStatus = error as ErrorWithStatus;
      status = errorWithStatus.status || Status.InternalServerError;
      message = error.message || 'Internal server error';
    }

    console.error('API Error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: ctx.request.url.pathname + ctx.request.url.search,
      method: ctx.request.method,
      body: null, // Body logging simplified for Deno
    });

    ctx.response.status = status;
    ctx.response.body = {
      error: 'Request failed',
      message,
      ...(Deno.env.get('NODE_ENV') === 'development' && {
        stack: error instanceof Error ? error.stack : undefined,
        details: error instanceof Error ? error.message : String(error)
      })
    };
  }
}