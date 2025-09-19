# Email Whitelist Management

## How the Whitelist Works

The application uses an email whitelist to control who can access the system. The whitelist is stored in `whitelist.json` in the root directory.

## Managing the Whitelist

### Option 1: Edit the JSON File Directly (Recommended)

1. Edit `whitelist.json` in the root directory
2. Add or remove emails from the `approvedEmails` array
3. Commit and push the changes to GitHub
4. Vercel will automatically redeploy with the updated whitelist

Example:
```json
{
  "approvedEmails": [
    "russ@skyeam.com.au",
    "russel.d.j.morris@gmail.com",
    "new.user@example.com"
  ],
  "comment": "Add approved email addresses here",
  "lastUpdated": "2025-01-19T03:48:00Z"
}
```

### Option 2: Use the Admin API (For Dynamic Updates)

If you're logged in as an admin (russ@skyeam.com.au or info@consultai.com.au), you can use the API:

**Add an email:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/whitelist \
  -H "Content-Type: application/json" \
  -d '{"action": "add", "email": "new.user@example.com"}'
```

**Remove an email:**
```bash
curl -X POST https://your-app.vercel.app/api/admin/whitelist \
  -H "Content-Type: application/json" \
  -d '{"action": "remove", "email": "old.user@example.com"}'
```

### Option 3: Environment Variable (Backup)

If the JSON file cannot be read, the system falls back to the `APPROVED_EMAILS` environment variable in Vercel:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update `APPROVED_EMAILS` with comma-separated emails
3. Example: `russ@skyeam.com.au,russel.d.j.morris@gmail.com`

## Priority Order

1. **JSON file** (`whitelist.json`) - Primary source, easy to edit
2. **Environment variable** (`APPROVED_EMAILS`) - Fallback if JSON fails

## Notes

- Emails are case-insensitive (automatically converted to lowercase)
- Both personal Microsoft accounts (@outlook.com, @live.com) and work accounts are supported
- Changes to the JSON file require a git commit and push to take effect
- Admin users: russ@skyeam.com.au, info@consultai.com.au