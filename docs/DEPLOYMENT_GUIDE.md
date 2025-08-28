# IOMS Vercel Deployment Guide

## Prerequisites
- Vercel account (free tier available)
- PostgreSQL database (Vercel Postgres, Supabase, or any PostgreSQL provider)
- GitHub repository connected to Vercel

## Step 1: Set up PostgreSQL Database

### Option A: Vercel Postgres (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new Postgres database
3. Note down the connection string

### Option B: Supabase (Free tier available)
1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string

## Step 2: Environment Variables

You need to set these environment variables in Vercel:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Optional: Add any other environment variables your app needs
NODE_ENV="production"
```

## Step 3: Deploy to Vercel

### Method 1: Vercel Dashboard (Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository: `smitunagar/IOMS-V1-POS-Working`
4. Set the following configuration:
   - Framework Preset: Next.js
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build`
   - Install Command: `npm install`
   - Output Directory: `.next`
5. Add your environment variables
6. Click "Deploy"

### Method 2: Vercel CLI (Alternative)
If the CLI works, you can use:
```bash
npx vercel --yes
```

## Step 4: Post-Deployment Setup

After deployment:

1. **Run Prisma Migrations**: Your database schema needs to be created
2. **Seed Data**: If you have initial data, seed it
3. **Test**: Verify all features work correctly

## Step 5: Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Add your custom domain
3. Configure DNS settings

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure DATABASE_URL is correct
2. **Build Errors**: Check for missing dependencies
3. **Environment Variables**: Verify all required vars are set

### Build Warnings:
Your app has some build warnings related to OpenTelemetry and Handlebars, but these won't prevent deployment.

## Current Status
✅ Project builds successfully locally
✅ Git repository is set up
✅ Vercel configuration files are ready
⚠️ Need to set up PostgreSQL database
⚠️ Need to configure environment variables

## Next Steps
1. Set up PostgreSQL database
2. Deploy via Vercel Dashboard
3. Configure environment variables
4. Test deployment
