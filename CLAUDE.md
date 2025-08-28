# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a REST API for fire restriction and burn status information, built with Deno and Oak framework using TypeScript. The API integrates with the New Brunswick Department of Natural Resources (NBDNR) ArcGIS service to provide real-time fire watch status queries.

## Development Commands

- **Development**: `deno task dev` - Runs with hot reload and watch mode
- **Start**: `deno task start` - Runs the application directly (no build needed)
- **Testing**: `deno task test` - Runs tests with Deno's native test runner
- **Test Coverage**: `deno task test:coverage` - Runs tests with coverage report
- **Linting**: `deno task lint` - Deno's built-in linter for TypeScript files
- **Formatting**: `deno task fmt` - Deno's built-in code formatter
- **Type Check**: `deno task check` - TypeScript type checking

## Architecture

### Core Structure
- **Entry Point**: `src/main.ts` - Oak app setup with security middleware and CORS
- **Routes**: Located in `src/routes/`
  - `fireWatch.ts` - Main API endpoint for fire watch status queries
  - `health.ts` - Health check endpoint
  - `geocoding.ts` - Geocoding endpoint for location resolution
- **Middleware**: 
  - `src/middleware/errorHandler.ts` - Centralized error handling
  - `src/middleware/security.ts` - Security headers (replaces helmet)
- **Services**: `src/services/nbdnrService.ts` - NBDNR ArcGIS integration

### API Endpoints
- `GET /api/health` - Health check endpoint
- `GET /api/fire-watch?lat={latitude}&lng={longitude}` - Fire watch status for coordinates
- `GET /api/geocode?location={location}` - Geocode location name to coordinates

### External Dependencies
- Integrates with NBDNR ArcGIS REST service for real-time fire data from New Brunswick
- Validates coordinates (lat: -90 to 90, lng: -180 to 180) before service calls
- Uses spatial queries to determine burn restrictions by geographic location
- Returns structured JSON responses with error handling

### Deno Configuration
- Native TypeScript support with strict mode enabled
- ES modules with top-level await support
- Built-in security with explicit permissions model
- No build step required - runs TypeScript directly