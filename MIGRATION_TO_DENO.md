# Migration from Node.js/Express to Deno/Oak

This document outlines the migration process from the original Node.js/Express setup to Deno/Oak.

## Key Changes Made

### 1. Runtime Migration
- **From**: Node.js with npm package management
- **To**: Deno with built-in dependency management
- **Benefits**: 
  - No `node_modules` directory
  - Native TypeScript support (no compilation needed)
  - Built-in security model with explicit permissions
  - Modern standard library

### 2. Framework Migration
- **From**: Express.js
- **To**: Oak (Deno's equivalent to Express)
- **Changes**:
  - Router instantiation: `Router()` → `new Router()`
  - Request/Response handling: `req, res` → `ctx` (context object)
  - Middleware signature: `(req, res, next)` → `(ctx, next)`

### 3. Dependency Management
- **Removed**: `package.json`, `package-lock.json`, `node_modules/`
- **Added**: `deno.json` with import map and task definitions
- **Dependencies now managed via**:
  - Import maps in `deno.json`
  - Direct URL imports from `deno.land`
  - Automatic dependency resolution

### 4. File Changes

#### New Files
- `src/main.ts` - New entry point (replaces `src/index.ts`)
- `src/middleware/security.ts` - Security headers middleware (replaces helmet)
- `src/main_test.ts` - Deno native tests
- `src/services/nbdnrService_test.ts` - Service tests
- `deno.json` - Deno configuration
- `deno_deploy.ts` - Deno Deploy entry point
- `build_deno.sh` - Deno build script

#### Modified Files
- All route files: Converted from Express to Oak
- `src/middleware/errorHandler.ts` - Updated for Oak context
- `src/docs/openapi.ts` - Updated for Oak and removed Node.js dependencies
- `src/services/nbdnrService.ts` - Updated imports for Deno
- `vercel.json` - Updated for Deno runtime
- `api/index.ts` - Updated entry point
- `README.md` - Updated documentation
- `CLAUDE.md` - Updated architecture description

### 5. Testing Migration
- **From**: Vitest with complex mocking
- **To**: Deno's native test runner
- **Benefits**:
  - No external dependencies
  - Built-in assertions
  - Native TypeScript support
  - Simplified test structure

### 6. Geocoding Service
- **From**: `node-geocoder` npm package
- **To**: Direct API calls using native `fetch()`
- **Benefits**:
  - No external dependencies
  - Better error handling
  - More control over API interactions

## Breaking Changes

### Environment Variables
- Access changed from `process.env` to `Deno.env.get()`
- Same environment variables are supported

### Import Statements
- All imports now use `.ts` extensions
- Imports use Deno's import map or direct URLs

### Permissions
Deno requires explicit permissions:
- `--allow-net` - For HTTP requests
- `--allow-read` - For reading files
- `--allow-env` - For environment variables

## Migration Benefits

1. **No Build Step**: TypeScript runs directly
2. **Better Security**: Explicit permission model
3. **Smaller Footprint**: No `node_modules` directory
4. **Modern Runtime**: Latest JavaScript/TypeScript features
5. **Built-in Tooling**: Linting, formatting, testing included
6. **Better Performance**: V8 optimizations and modern runtime

## Running the Migrated Application

### Development
```bash
deno task dev
```

### Production
```bash
deno task start
```

### Testing
```bash
deno task test
deno task test:coverage
```

### Code Quality
```bash
deno task lint
deno task fmt
deno task check
```

## Deployment Options

1. **Deno Deploy**: Use `deno_deploy.ts` as entry point
2. **Vercel**: Updated to use Deno runtime
3. **Docker**: Can use official Deno Docker images
4. **Traditional VPS**: Direct Deno installation

## Files Safe to Remove

After verifying the migration works correctly, these Node.js-specific files can be removed:
- `package.json`
- `package-lock.json`
- `node_modules/` directory
- `tsconfig.json`
- `eslint.config.js`
- `vitest.config.ts`
- `build.sh` (replaced by `build_deno.sh`)
- `dist/` directory (no longer needed)
- All `src/__tests__/` directories (replaced by `*_test.ts` files)
