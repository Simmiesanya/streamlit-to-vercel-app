# Deploying to Vercel with GCP Cloud SQL

## Steps to Deploy

1. **Click "Publish" in v0** or push to GitHub and connect to Vercel

2. **Add Environment Variable in Vercel Dashboard:**
   - Go to your project settings → Environment Variables
   - Add: `GCP_DATABASE_URL`
   - Value: `postgresql://postgres:[PASSWORD]@34.27.19.178:5432/cbn_warehouse?sslmode=require`

3. **Update `lib/db.ts` for Production:**
   Replace the current `lib/db.ts` content with `lib/db-vercel-functions.ts`

4. **Deploy!**

## Connection Details

- **Works in Vercel production**: ✅ Yes - Vercel serverless functions support TCP connections
- **Works in v0 preview**: ❌ No - Browser-based runtime doesn't support TCP
- **SSL Required**: ✅ Your GCP Cloud SQL instance requires SSL (sslmode=require)
- **Connection Pooling**: ✅ Using pg Pool with Vercel's attachDatabasePool helper

## GCP Cloud SQL Requirements

Make sure your GCP Cloud SQL instance:
- Allows connections from `0.0.0.0/0` (or Vercel's IP ranges)
- Has SSL enabled
- Firewall allows port 5432

## Testing After Deployment

Once deployed, visit: `https://your-app.vercel.app`

The app will connect to your live `vault.fx_rates_daily` table and display real data.
