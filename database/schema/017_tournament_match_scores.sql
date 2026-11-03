-- Sport-aware tournament match scoring: schedule time/venue, LIVE status, JSON score payload.

ALTER TABLE tournament_matches
  ADD COLUMN IF NOT EXISTS match_time TIME,
  ADD COLUMN IF NOT EXISTS venue VARCHAR(200),
  ADD COLUMN IF NOT EXISTS score_data JSONB;

ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_status_check;
ALTER TABLE tournament_matches
  ADD CONSTRAINT tournament_matches_status_check
  CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'NO_RESULT'));

-- Replace the status/result pairing check so LIVE can exist without a result.
DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'tournament_matches'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%COMPLETED%'
      AND pg_get_constraintdef(con.oid) ILIKE '%result%'
  LOOP
    EXECUTE format('ALTER TABLE tournament_matches DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

ALTER TABLE tournament_matches
  ADD CONSTRAINT tournament_matches_status_result_check
  CHECK ((status = 'COMPLETED') = (result IS NOT NULL));
