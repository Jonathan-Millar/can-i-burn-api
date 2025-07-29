import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fireWatchRouter } from './routes/fireWatch';
import { healthRouter } from './routes/health';
import { geocodingRouter } from './routes/geocoding';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api', fireWatchRouter);
app.use('/api', geocodingRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🔥 Can I Burn API server running on port ${PORT}`);
});

export default app;