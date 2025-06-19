-- Create user ID mapping table
CREATE TABLE IF NOT EXISTS user_id_mappings (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT UNIQUE NOT NULL,
  current_user_id UUID NOT NULL,
  previous_user_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_auth_user_id ON user_id_mappings(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_id_mappings_current_user_id ON user_id_mappings(current_user_id);

-- Create function to get current user_id from auth_user_id
CREATE OR REPLACE FUNCTION get_current_user_id(auth_id TEXT)
RETURNS UUID AS $$
DECLARE
  result UUID;
BEGIN
  SELECT current_user_id INTO result
  FROM user_id_mappings
  WHERE auth_user_id = auth_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user mapping
CREATE OR REPLACE FUNCTION update_user_mapping(auth_id TEXT, new_user_id UUID)
RETURNS VOID AS $$
DECLARE
  old_user_id UUID;
BEGIN
  -- Get the current user_id if mapping exists
  SELECT current_user_id INTO old_user_id
  FROM user_id_mappings
  WHERE auth_user_id = auth_id;
  
  IF old_user_id IS NOT NULL THEN
    -- Update existing mapping, adding old user_id to previous_user_ids array
    UPDATE user_id_mappings
    SET 
      current_user_id = new_user_id,
      previous_user_ids = array_append(previous_user_ids, old_user_id),
      updated_at = NOW()
    WHERE auth_user_id = auth_id;
  ELSE
    -- Create new mapping
    INSERT INTO user_id_mappings (auth_user_id, current_user_id)
    VALUES (auth_id, new_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;
