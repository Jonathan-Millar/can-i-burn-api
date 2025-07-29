# 🔥 Can I Burn API

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

A modern REST API for fire restriction and burn status information, providing real-time fire watch data and geocoding services. Built with Express.js and TypeScript for reliability and type safety.

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJonathan-Millar%2Fcan-i-burn-api&env=LOCATIONIQ_API_KEY&envDescription=Optional%20LocationIQ%20API%20key%20for%20enhanced%20geocoding&envLink=https%3A%2F%2Flocationiq.com%2Fregister&project-name=can-i-burn-api&repository-name=can-i-burn-api)

*Click the button above to deploy this API to Vercel!*

## 🚀 Features

- **Fire Watch Status**: Get real-time fire restriction information for any coordinates
- **Geocoding Service**: Convert location names to coordinates with fallback providers
- **Health Monitoring**: Built-in health check endpoint for monitoring
- **Security First**: Helmet and CORS protection enabled
- **Type Safe**: Full TypeScript implementation with strict type checking
- **Error Handling**: Comprehensive error handling with development-friendly stack traces
- **Hot Reload**: Development server with automatic reloading

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- TypeScript knowledge (recommended)

### Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd can-i-burn-api

# Install dependencies
npm install

# Build the project
npm run build
```

## 🚀 Quick Start

### Development Mode

```bash
# Start development server with hot reload
npm run dev
```

The API will be available at `http://localhost:3001`

### Production Mode

```bash
# Build and start production server
npm run build
npm start
```

## 📡 API Endpoints

### Health Check

Check if the API is running and healthy.

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "can-i-burn-api"
}
```

### Fire Watch Status

Get fire restriction and burn status information for specific coordinates.

```http
GET /api/fire-watch?lat={latitude}&lng={longitude}
```

**Parameters:**
- `lat` (required): Latitude (-90 to 90)
- `lng` (required): Longitude (-180 to 180)

**Example Request:**
```bash
curl "http://localhost:3001/api/fire-watch?lat=45.5017&lng=-73.5673"
```

**Response:**
```json
{
  "canBurn": false,
  "restrictions": {
    "level": "high",
    "description": "Fire restrictions in effect"
  },
  "coordinates": {
    "latitude": 45.5017,
    "longitude": -73.5673
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**
```json
// Missing parameters
{
  "error": "Missing required parameters",
  "message": "Both lat and lng query parameters are required"
}

// Invalid coordinates
{
  "error": "Invalid coordinates",
  "message": "lat and lng must be valid numbers"
}

// Out of range
{
  "error": "Invalid latitude",
  "message": "Latitude must be between -90 and 90"
}
```

### Geocoding

Convert location names to coordinates using multiple geocoding providers.

```http
GET /api/geocode?location={location_name}
```

**Parameters:**
- `location` (required): Location name or address

**Example Request:**
```bash
curl "http://localhost:3001/api/geocode?location=Montreal,%20Canada"
```

**Response:**
```json
{
  "location": "Montreal, Canada",
  "coordinates": {
    "latitude": 45.5017,
    "longitude": -73.5673
  },
  "formattedAddress": "Montreal, QC, Canada",
  "country": "Canada",
  "city": "Montreal",
  "state": "Quebec",
  "source": "geocoding"
}
```

**Fallback Behavior:**
- Primary: LocationIQ API
- Fallback: OpenStreetMap (free, no API key required)

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Geocoding API Keys (optional - fallback available)
LOCATIONIQ_API_KEY=your_locationiq_api_key_here
```

**Environment Variables:**
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)
- `LOCATIONIQ_API_KEY`: LocationIQ API key (optional, has default)

## 💻 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking without build
npm run typecheck
```

### Project Structure

```
can-i-burn-api/
├── src/
│   ├── index.ts              # Application entry point
│   ├── middleware/
│   │   └── errorHandler.ts   # Global error handling
│   └── routes/
│       ├── fireWatch.ts      # Fire watch endpoints
│       ├── geocoding.ts      # Geocoding endpoints
│       └── health.ts         # Health check endpoint
├── dist/                     # Compiled JavaScript (generated)
├── coverage/                 # Test coverage reports (generated)
├── package.json
├── tsconfig.json
├── eslint.config.js
└── README.md
```

### Code Quality

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Code linting with TypeScript-specific rules
- **Prettier**: Code formatting (configure as needed)
- **Helmet**: Security headers middleware
- **CORS**: Cross-origin resource sharing enabled

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

### Test Coverage

Current test coverage status:

> **Note**: Test files are not yet implemented. The project is configured with Vitest for testing. To add tests, create files with `.test.ts` or `.spec.ts` extensions in the `src/` directory or a dedicated `tests/` folder.

**Testing Framework:**
- **Vitest**: Fast unit testing framework
- **Coverage**: V8 coverage provider
- **TypeScript**: Full TypeScript support in tests

### Adding Tests

Example test structure:

```typescript
// src/routes/__tests__/health.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../index';

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('service', 'can-i-burn-api');
  });
});
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

The easiest way to deploy this API is using Vercel's serverless platform:

#### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FJonathan-Millar%2Fcan-i-burn-api&env=LOCATIONIQ_API_KEY&envDescription=Optional%20LocationIQ%20API%20key%20for%20enhanced%20geocoding&envLink=https%3A%2F%2Flocationiq.com%2Fregister&project-name=can-i-burn-api&repository-name=can-i-burn-api)

#### Manual Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables** (optional):
   - `LOCATIONIQ_API_KEY`: Your LocationIQ API key for enhanced geocoding

#### Vercel Configuration

The project includes:
- [`vercel.json`](vercel.json): Vercel deployment configuration
- [`build.sh`](build.sh): Custom build script for Vercel
- Automatic TypeScript compilation
- Serverless function optimization

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3001

CMD ["npm", "start"]
```

### Traditional Server Deployment

#### Environment Setup

1. Set `NODE_ENV=production`
2. Configure environment variables
3. Ensure `dist/` directory exists (run `npm run build`)
4. Set up process manager (PM2, systemd, etc.)

#### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start dist/index.js --name "can-i-burn-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Health Checks

The `/api/health` endpoint can be used for:
- Load balancer health checks
- Container orchestration health probes
- Monitoring system checks
- Vercel deployment verification

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Run linting before committing
- Ensure all tests pass

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **can-i-burn-service**: Core fire watch logic service (local dependency)

## 📞 Support

For support and questions:

1. Check existing [Issues](../../issues)
2. Create a new issue with detailed information
3. Include error logs and reproduction steps

---

**Built with ❤️ using TypeScript and Express.js**