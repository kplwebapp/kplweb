-- Teams belong to a game (a tournament category such as Cricket or Carrom).
-- Existing teams are assumed to be cricket teams. Names and codes only need to be unique within a game.
-- Safe to run more than once.

ALTER TABLE teams ADD COLUMN IF NOT EXISTS category_id INT REFERENCES activity_categories(category_id);

UPDATE teams SET category_id = (
  SELECT category_id FROM activity_categories WHERE kind = 'TOURNAMENT' AND slug = 'cricket'
)
WHERE category_id IS NULL;

ALTER TABLE teams ALTER COLUMN category_id SET NOT NULL;

ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_team_name_key;
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_team_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_category_name ON teams (category_id, lower(team_name));
CREATE UNIQUE INDEX IF NOT EXISTS uq_teams_category_code ON teams (category_id, team_code) WHERE team_code IS NOT NULL;
