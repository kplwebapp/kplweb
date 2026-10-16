-- Optional cover image for the public auction landing cards.
-- Falls back to the linked tournament's image when this is null.

ALTER TABLE auctions ADD COLUMN IF NOT EXISTS image_url TEXT;
