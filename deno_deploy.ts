// Deno Deploy entry point for Hono
import app from './src/main.ts';

console.log(`🔥 Can I Burn API (Hono) starting on Deno Deploy`);

// Deno Deploy uses Deno.serve automatically
Deno.serve(app.fetch);
