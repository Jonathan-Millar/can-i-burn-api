# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a REST API for fire restriction and burn status information, built with Express.js and TypeScript. The API serves as a wrapper around the `can-i-burn-service` package, providing HTTP endpoints for fire watch status queries.

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/`
- **Development**: `npm run dev` - Runs with hot reload using tsx
- **Start**: `npm start` - Runs the compiled JavaScript from `dist/`
- **Testing**: `npm test` - Runs tests with Vitest
- **Test Coverage**: `npm run test:coverage` - Runs tests with coverage report
- **Linting**: `npm run lint` - ESLint check for TypeScript files
- **Lint Fix**: `npm run lint:fix` - Auto-fix ESLint issues
- **Type Check**: `npm run typecheck` - TypeScript compilation check without output

## Architecture

### Core Structure
- **Entry Point**: `src/index.ts` - Express app setup with security middleware (helmet, cors)
- **Routes**: Located in `src/routes/`
  - `fireWatch.ts` - Main API endpoint for fire watch status queries
  - `health.ts` - Health check endpoint
- **Middleware**: `src/middleware/errorHandler.ts` - Centralized error handling with development mode stack traces

### API Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/fire-watch?lat={latitude}&lng={longitude}` - Fire watch status for coordinates

### External Dependencies
- Uses `can-i-burn-service` package (local file dependency) for core fire watch logic
- Validates coordinates (lat: -90 to 90, lng: -180 to 180) before service calls
- Returns structured JSON responses with error handling

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Target ES2022, CommonJS modules
- Source maps and declarations generated for debugging