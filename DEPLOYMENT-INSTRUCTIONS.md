# Deployment Instructions

Your NairaFX app is now ready to deploy to Vercel and connect to your GCP Cloud SQL database!

## Pre-Deployment Checklist

✅ Code is production-ready with `pg` package for PostgreSQL connection
✅ Database connection uses `GCP_DATABASE_URL` environment variable
✅ Connection pooling optimized for Vercel serverless functions

## Deployment Steps

### 1. Click "Publish" in v0

Click the **Publish** button in the top right of your v0 workspace. This will deploy your app to Vercel.

### 2. Configure Environment Variables

After publishing, go to your Vercel project settings:

1. Navigate to **Settings** → **Environment Variables**
2. Add the following variable:
   - **Key**: `GCP_DATABASE_URL`
   - **Value**: `postgresql://postgres:[YOUR_PASSWORD]@34.27.19.178:5432/cbn_warehouse?sslmode=require`
   - **Environments**: Production, Preview, Development (check all)

### 3. Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**

### 4. Verify Connection

Once deployed, your app should:
- Display real data from `vault.fx_rates_daily` table
- Update automatically as your daily pipeline adds new data
- Show the current date in the header

## Troubleshooting

**If you see "Failed to fetch data":**
- Check that `GCP_DATABASE_URL` is set correctly in Vercel
- Verify your GCP Cloud SQL instance allows connections from Vercel's IP ranges
- Check that the database credentials are correct

**To enable Vercel to connect to GCP Cloud SQL:**
You may need to whitelist Vercel's IP addresses in your GCP Cloud SQL instance:
1. Go to GCP Console → Cloud SQL → Your Instance
2. Go to **Connections** → **Networking**
3. Add authorized network: `0.0.0.0/0` (or specific Vercel IP ranges for better security)

## Database Schema

Your app expects this table structure:
\`\`\`sql
vault.fx_rates_daily (
  date DATE,
  currency VARCHAR,
  buying_rate NUMERIC,
  central_rate NUMERIC,
  selling_rate NUMERIC
)
\`\`\`

## PWA Installation

Once deployed, users can:
- Visit your app URL
- Click "Add to Home Screen" on mobile devices
- Use the app like a native mobile application

## Support

If you encounter any issues during deployment, check:
- Vercel deployment logs for error messages
- Your GCP Cloud SQL connection settings
- Environment variables are properly set
\`\`\`

```ts file="lib/db-vercel-functions.ts" isDeleted="true"
...deleted...
