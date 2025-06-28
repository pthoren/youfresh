# Vercel Blob Storage Setup Guide

## Getting Your Blob Storage Credentials

### 1. Create Blob Storage in Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Storage** tab
4. Click **Create Database** → **Blob**
5. Choose a name for your blob store (e.g., "youfresh-images")
6. Click **Create**

### 2. Get Your Tokens
After creating the blob storage:
1. Go to **Settings** tab of your blob storage
2. Copy the **Read/Write Token**
3. Optionally note the **Store ID** if you need multiple stores

### 3. Add to Environment Variables

#### For Local Development (.env.local):
```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx_xxxxxxxxxx
# Optional: only if you have multiple blob stores
BLOB_STORE_ID=your_blob_store_id_here
```

#### For Production (Vercel Dashboard):
1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the same variables:
   - `BLOB_READ_WRITE_TOKEN`
   - `BLOB_STORE_ID` (if needed)

### 4. Typical Token Format
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_AbCd1234_EfGh5678IjKl
```

## Testing the Connection

### 1. Check Environment Setup
```javascript
// The app will log this on startup if blob storage is configured
console.log('Blob storage configured:', !!process.env.BLOB_READ_WRITE_TOKEN);
```

### 2. Test Image Generation
1. Create a new recipe in your app
2. Check the server logs for:
   ```
   Recipe image uploaded to blob storage: recipe-images/user123_pasta_xyz.png
   Blob URL: https://abc123.public.blob.vercel-storage.com/recipe-images/user123_pasta_xyz.png
   ```

### 3. Verify Image Access
- The generated URL should be publicly accessible
- Images should appear in your recipe cards
- Check Network tab in browser DevTools for successful image loads

## Common Issues

### ❌ "BLOB_READ_WRITE_TOKEN not configured"
- **Solution**: Add the token to your environment variables
- **Check**: Make sure `.env.local` exists and has the correct token

### ❌ "Access denied" or 403 errors
- **Solution**: Verify your token has read/write permissions
- **Check**: Token should start with `vercel_blob_rw_`

### ❌ Images not appearing
- **Solution**: Check that blob URLs are publicly accessible
- **Check**: Try opening the blob URL directly in browser

### ❌ "Store not found" errors
- **Solution**: Add `BLOB_STORE_ID` if you have multiple stores
- **Check**: Verify the store ID matches your Vercel dashboard

## Environment Variables Summary

```env
# Required - Get from Vercel Dashboard → Storage → Blob → Settings
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxx_xxxxxxxxxx

# Optional - Only needed if you have multiple blob stores
BLOB_STORE_ID=your_blob_store_id_here

# Also required for the app to work
OPENAI_API_KEY=sk-xxxxxxxxxx
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
# ... other variables
```

## Folder Structure in Blob Storage

The app organizes images like this:
```
your-blob-store/
└── recipe-images/
    ├── user123_chicken-curry_abc123.png
    ├── user123_pasta-salad_def456.png
    └── user456_fish-tacos_ghi789.png
```

This makes it easy to:
- Organize by user
- Identify recipes
- Ensure unique filenames
- Clean up if needed
