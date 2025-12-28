# Supabase Setup Guide

This guide will help you complete the Supabase setup for the Camel Beauty Evaluation Platform.

## Database Schema

The database schema has already been created with the following tables:
- `profiles` - User profiles with roles
- `camels` - Camel information
- `camel_images` - Image references
- `evaluations` - Evaluation scores

All tables have Row Level Security (RLS) enabled with appropriate policies.

## Storage Bucket Setup

You need to manually create a storage bucket for camel images:

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project at [app.supabase.com](https://app.supabase.com)

2. **Open Storage Section**
   - Click on "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket"
   - Bucket name: `camels`
   - Public bucket: **Yes** (enable this)
   - Click "Create bucket"

4. **Configure Bucket Policies (Optional but Recommended)**

   For better security, you can set up policies for the bucket:

   ```sql
   -- Allow authenticated users to upload images
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'camels');

   -- Allow public read access
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'camels');

   -- Allow users to delete their own images
   CREATE POLICY "Users can delete own images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'camels' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Verification

After creating the bucket:

1. Go to Storage > camels
2. Try uploading a test image
3. Verify you can access the image via its public URL

## Testing the Setup

1. **Register a new account** on the platform
2. **Create a camel profile**
3. **Upload an image** for the camel
4. **View the evaluation** - it should show mock scores

If any step fails, check:
- The storage bucket is named exactly `camels`
- The bucket is set to public
- Your Supabase environment variables are correct

## User Roles

By default, new users get the "visitor" role. To change a user's role:

1. Go to Supabase Dashboard > Table Editor
2. Select the `profiles` table
3. Find the user's row
4. Change the `role` column to one of:
   - `visitor`
   - `owner`
   - `expert`
   - `admin`

## Troubleshooting

### Images not uploading
- Verify the bucket exists and is named `camels`
- Check that the bucket is public
- Verify the file is a valid image (JPG/PNG)

### Authentication issues
- Check your Supabase URL and Anon Key in environment variables
- Verify the email is confirmed (if email confirmation is enabled)

### RLS Policy errors
- Ensure all tables have RLS enabled
- Check that policies match the schema in the migration file

## Support

For issues with Supabase setup:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
