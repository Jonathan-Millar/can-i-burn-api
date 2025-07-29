import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { healthRouter } from '../health';

const app = express();
app.use('/api', healthRouter);

describe('Health Route', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('service', 'can-i-burn-api');
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  it('should return valid ISO timestamp', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    const timestamp = response.body.timestamp;
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});