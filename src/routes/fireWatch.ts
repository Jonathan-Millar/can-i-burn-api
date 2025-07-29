import { Router, Request, Response, NextFunction } from 'express';
import { CanIBurnService } from 'can-i-burn-service';

const router = Router();
const canIBurnService = new CanIBurnService();

interface FireWatchQuery {
  lat?: string;
  lng?: string;
}

router.get('/fire-watch', async (req: Request<object, object, object, FireWatchQuery>, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both lat and lng query parameters are required'
      });
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        error: 'Invalid coordinates',
        message: 'lat and lng must be valid numbers'
      });
      return;
    }

    if (latitude < -90 || latitude > 90) {
      res.status(400).json({
        error: 'Invalid latitude',
        message: 'Latitude must be between -90 and 90'
      });
      return;
    }

    if (longitude < -180 || longitude > 180) {
      res.status(400).json({
        error: 'Invalid longitude',
        message: 'Longitude must be between -180 and 180'
      });
      return;
    }

    const coordinates = { latitude, longitude };
    const fireWatchResponse = await canIBurnService.getFireWatchStatus(coordinates);

    res.json(fireWatchResponse);
  } catch (error) {
    next(error);
  }
});

export { router as fireWatchRouter };