# Setting Up Vercel KV for Whitelist Storage

## Why Vercel KV?
The whitelist management system now supports both local file storage (for development) and Vercel KV (for production). Vercel KV provides persistent storage that survives deployments and server restarts.

## Setup Instructions

### 1. Create a KV Database in Vercel Dashboard

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `frontend-auth-system-clean`
3. Navigate to the **Storage** tab
4. Click **Create Database**
5. Choose **KV** (Redis-compatible)
6. Select your preferred region (closest to your users)
7. Give it a name like `whitelist-kv`
8. Click **Create**

### 2. Environment Variables (Automatically Added)

When you create a KV database, Vercel automatically adds these environment variables:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 3. Pull Environment Variables for Local Development

To test KV locally, you need to pull the environment variables:

```bash
vercel env pull .env.development.local
```

Or manually add them to `.env.local`:
```
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

### 4. How It Works

The system automatically detects the storage method:
- **With KV configured**: Uses Vercel KV (persistent)
- **Without KV**: Falls back to `whitelist.json` file (local only)

### 5. Initial Data Migration

If you have existing emails in your `whitelist.json`, they will be automatically loaded the first time the system runs with KV.

### 6. Monitoring

You can monitor your KV database usage in the Vercel dashboard:
- Storage tab → Select your KV database
- View metrics, data browser, and logs

## Storage Behavior

| Environment | Storage Method | Persistence |
|------------|---------------|-------------|
| Local Development (no KV) | `whitelist.json` file | Yes (local file) |
| Local Development (with KV) | Vercel KV | Yes (cloud) |
| Production (Vercel) | Vercel KV | Yes (cloud) |

## Cost

- **Free tier**: 30,000 requests/month, 256MB storage
- **Pro tier**: $1/month minimum for additional usage

## Troubleshooting

If the whitelist isn't working:
1. Check that KV environment variables are set
2. Check Vercel dashboard logs for errors
3. Verify your user email is in the admin list
4. Try clearing browser cache/cookies

## API Response

The API now returns the storage type being used:
```json
{
  "approvedEmails": [...],
  "storageType": "Vercel KV (Persistent)",
  "note": "Data is stored persistently in Vercel KV"
}
```