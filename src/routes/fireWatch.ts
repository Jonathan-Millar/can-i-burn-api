import { Router, Status } from '@oak/oak';
import { NBDNRService } from '../services/nbdnrService.ts';

const router = new Router();
const nbdnrService = new NBDNRService();

router.get('/api/fire-watch', async (ctx) => {
  const url = new URL(ctx.request.url);
  const lat = url.searchParams.get('lat');
  const lng = url.searchParams.get('lng');

  if (!lat || !lng) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = {
      error: 'Missing required parameters',
      message: 'Both lat and lng query parameters are required'
    };
    return;
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (isNaN(latitude) || isNaN(longitude)) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = {
      error: 'Invalid coordinates',
      message: 'lat and lng must be valid numbers'
    };
    return;
  }

  if (latitude < -90 || latitude > 90) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = {
      error: 'Invalid latitude',
      message: 'Latitude must be between -90 and 90'
    };
    return;
  }

  if (longitude < -180 || longitude > 180) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = {
      error: 'Invalid longitude',
      message: 'Longitude must be between -180 and 180'
    };
    return;
  }

  const coordinates = { latitude, longitude };
  const fireWatchResponse = await nbdnrService.getFireWatchStatus(coordinates);

  ctx.response.body = fireWatchResponse;
});

export { router as fireWatchRouter };