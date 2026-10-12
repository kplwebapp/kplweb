-- Add blood group field for member profiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group VARCHAR(5);
