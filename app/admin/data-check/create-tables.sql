-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  age_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedbacks table if it doesn't exist
CREATE TABLE IF NOT EXISTS feedbacks (
  feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  brand TEXT NOT NULL,
  size TEXT NOT NULL,
  fit_score INTEGER NOT NULL,
  kept_status TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  is_final BOOLEAN DEFAULT TRUE,
  original_feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE SET NULL,
  points_awarded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table if it doesn't exist
CREATE TABLE IF NOT EXISTS videos (
  video_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  format TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_validations table if it doesn't exist
CREATE TABLE IF NOT EXISTS video_validations (
  validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE CASCADE,
  has_human BOOLEAN NOT NULL,
  has_garment BOOLEAN NOT NULL,
  has_face BOOLEAN NOT NULL,
  has_occlusion BOOLEAN NOT NULL,
  has_blur BOOLEAN NOT NULL,
  has_noise BOOLEAN NOT NULL,
  is_valid BOOLEAN NOT NULL,
  reasons TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_spins table if it doesn't exist
CREATE TABLE IF NOT EXISTS reward_spins (
  spin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  reward_amount INTEGER NOT NULL,
  reward_tier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
