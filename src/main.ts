import { Application } from '@oak/oak';
import { oakCors } from '@oak/cors';
import { healthRouter } from './routes/health.ts';
import { fireWatchRouter } from './routes/fireWatch.ts';
import { geocodingRouter } from './routes/geocoding.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { securityHeaders } from './middleware/security.ts';
import { registerDocs } from './docs/openapi.ts';

const app = new Application();
const PORT = parseInt(Deno.env.get('PORT') || '3001');

// Security middleware (equivalent to helmet)
app.use(securityHeaders);

// CORS middleware
app.use(oakCors({
  origin: true, // Allow all origins
  credentials: true,
}));

// Routes
app.use(healthRouter.routes());
app.use(healthRouter.allowedMethods());

app.use(fireWatchRouter.routes());
app.use(fireWatchRouter.allowedMethods());

app.use(geocodingRouter.routes());
app.use(geocodingRouter.allowedMethods());

// Documentation routes
registerDocs(app);

// Global error handler
app.use(errorHandler);

// Start server
if (import.meta.main) {
  console.log(`🔥 Can I Burn API server running on port ${PORT}`);
  await app.listen({ port: PORT });
}

export { app };
