-- Tournaments may opt into player auctions (cricket). Non-auction tournaments stay out of auction pickers.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS requires_auction BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN events.requires_auction IS
  'When true (typically cricket tournaments), this event can be linked to an auction.';

-- Existing linked auctions imply the tournament required one.
UPDATE events e
SET requires_auction = TRUE
WHERE e.kind = 'TOURNAMENT'
  AND EXISTS (SELECT 1 FROM auctions a WHERE a.event_id = e.event_id);
