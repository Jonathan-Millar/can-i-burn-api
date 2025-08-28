import { Context, Next } from '@oak/oak';

/**
 * Security middleware for Oak - equivalent to helmet for Express
 * Sets security headers to protect against common vulnerabilities
 */
export async function securityHeaders(ctx: Context, next: Next) {
  // Set security headers
  ctx.response.headers.set('X-Content-Type-Options', 'nosniff');
  ctx.response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  ctx.response.headers.set('X-XSS-Protection', '1; mode=block');
  ctx.response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  ctx.response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  ctx.response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'"
  );

  await next();
}
