-- Create face_images table for storing user face data
CREATE TABLE IF NOT EXISTS face_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'
);

-- Create face_verification_logs table for tracking verification attempts
CREATE TABLE IF NOT EXISTS face_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id INTEGER,
  verification_status TEXT NOT NULL, -- 'verified', 'failed', 'attempted'
  confidence_score FLOAT,
  matched_user_id UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  device_info JSONB
);

-- Create indexes for better query performance
CREATE INDEX idx_face_images_user_id ON face_images(user_id);
CREATE INDEX idx_face_images_is_primary ON face_images(is_primary);
CREATE INDEX idx_verification_logs_user_id ON face_verification_logs(user_id);
CREATE INDEX idx_verification_logs_event_id ON face_verification_logs(event_id);
CREATE INDEX idx_verification_logs_verified_at ON face_verification_logs(verified_at);

-- Set up storage bucket for face images in Supabase Storage
-- This should be done through the Supabase dashboard:
-- 1. Go to Storage > Buckets
-- 2. Create a new public bucket named 'face-images'
-- 3. Set appropriate access policies
