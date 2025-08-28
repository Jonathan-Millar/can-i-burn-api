import { Router } from '@oak/oak';

const router = new Router();

router.get('/api/health', (ctx) => {
  ctx.response.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'can-i-burn-api'
  };
});

export { router as healthRouter };