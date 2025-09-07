# Supabase 406 Error Investigation Guide

## Issue Summary
The public-facing website is experiencing a **406 Not Acceptable** error when making a direct Supabase REST API call to:
```
https://oycmdmrnschixthatslb.supabase.co/rest/v1/home_content?select=*&is_published=eq.true
```

## What We Know
- ✅ The `home_content` table **DOES** have an `is_published` column (boolean, nullable)
- ✅ The admin dashboard correctly uses Next.js API routes (`/api/home`)
- ❌ There's a direct client-side Supabase REST API call causing the 406 error
- ❌ The call is filtering by `is_published=eq.true` but getting rejected

## Investigation Tasks

### 1. Find the Direct Supabase Call
Search the public website codebase for:
```bash
# Search for client-side Supabase usage
grep -r "createClient" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
grep -r "supabase.*home_content" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
grep -r "rest/v1/home_content" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
grep -r "is_published.*eq" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx"
```

### 2. Check Browser Network Tab
In the browser developer tools:
- Look for the failing request in the Network tab
- Check the **Initiator** column to see which JavaScript file is making the call
- Look for the file path (e.g., `index-BkfXuC31.js:71`)

### 3. Verify Database Data
Check the current `home_content` record:
```sql
SELECT id, is_published, background_video_path, video_title 
FROM home_content 
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### 4. Check Environment Variables
Verify if there are any client-side Supabase environment variables:
```bash
grep -r "NEXT_PUBLIC_SUPABASE" --include="*.env*" --include="*.js" --include="*.ts"
```

### 5. Look for Service Workers or Cached Code
- Check if there are any service workers making the call
- Clear browser cache and check if the error persists
- Look for any build artifacts or cached JavaScript

## Potential Root Causes

### A. NULL Value Issue
If `is_published` is NULL in the database:
- The `is_published=eq.true` filter will fail
- **Fix**: Update the record to have `is_published = true`

### B. Client-Side Supabase Client
If there's a client-side Supabase client:
- It might be making direct REST API calls
- **Fix**: Remove or redirect to use Next.js API routes

### C. Cached/Old Code
If there's old cached code:
- It might be using an outdated API pattern
- **Fix**: Clear cache and update the code

### D. Browser Extension/Service Worker
If something else is making the call:
- Check browser extensions
- Check for service workers
- **Fix**: Disable extensions or clear service workers

## Quick Fixes to Try

### 1. Update Database Record
```sql
UPDATE home_content 
SET is_published = true 
WHERE id = '00000000-0000-0000-0000-000000000001';
```

### 2. Check for Client-Side Supabase
Look for files like:
- `lib/supabase/client.ts`
- `utils/supabase.ts`
- Any file with `createClient` for browser use

### 3. Search for Direct API Calls
Look for patterns like:
- `fetch('https://oycmdmrnschixthatslb.supabase.co/rest/v1/...')`
- `supabase.from('home_content').select('*').eq('is_published', true)`

## Expected Outcome
Once the investigation is complete, we should:
1. Identify the source of the direct Supabase call
2. Either fix the data (if NULL issue) or redirect the call to use the proper API route
3. Ensure all home content requests go through `/api/home` instead of direct Supabase calls

## Files to Focus On
- Any client-side Supabase configuration files
- Home page components that might fetch data
- Any service files that make API calls
- Build artifacts or cached JavaScript files

---

**Copy this file to your public website project and have the AI agent investigate the issue systematically.**
