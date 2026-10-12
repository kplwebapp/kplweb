-- Add vibhaag (community/region) field for member profiles
ALTER TABLE users ADD COLUMN IF NOT EXISTS vibhaag VARCHAR(100);
