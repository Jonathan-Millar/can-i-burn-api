# Deploy to Deno Deploy (Recommended)

Deno Deploy is the official hosting platform for Deno applications and provides the best experience.

## Setup

1. **Install Deno Deploy CLI**:
   ```bash
   deno install -A --global https://deno.land/x/deploy/deployctl.ts
   ```

2. **Create account**: Visit https://dash.deno.com and sign up

3. **Deploy**:
   ```bash
   # Deploy your application
   deployctl deploy --project=can-i-burn-api deno_deploy.ts
   
   # Or with a custom domain
   deployctl deploy --project=can-i-burn-api --prod deno_deploy.ts
   ```

## Benefits of Deno Deploy

- ✅ **Native Deno Support**: No compatibility issues
- ✅ **Global Edge Network**: Fast worldwide performance  
- ✅ **Zero Config**: No build steps or configuration needed
- ✅ **Environment Variables**: Full support
- ✅ **Custom Domains**: Easy domain setup
- ✅ **Free Tier**: Generous limits for most applications

## Environment Variables

Set in Deno Deploy dashboard:
- `LOCATIONIQ_API_KEY` (if using LocationIQ)
- `NODE_ENV=production`

## Your Application is Ready!

The `deno_deploy.ts` file is already configured for Deno Deploy.
