// Deno Deploy entry point
import { app } from './src/main.ts';

// Deno Deploy automatically provides the port via environment
const port = parseInt(Deno.env.get('PORT') || '8000');

console.log(`🔥 Can I Burn API starting on Deno Deploy (port ${port})`);

// Start the server
await app.listen({ port });
