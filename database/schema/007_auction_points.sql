-- Points-based auction rules (no currency)

ALTER TABLE auctions
  ALTER COLUMN budget_per_team SET DEFAULT 100000;

ALTER TABLE auctions
  ADD COLUMN IF NOT EXISTS max_players_per_team INT NOT NULL DEFAULT 16;

UPDATE auctions SET budget_per_team = 100000 WHERE budget_per_team > 500000;
UPDATE auctions SET max_players_per_team = 16 WHERE max_players_per_team IS NULL;
