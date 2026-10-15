-- Auction management: lifecycle, per-auction teams, budgets and player categories, a player pool
-- linked to tournament registrations, and permanent bid and event history.
-- Additive only. Auctions that exist before this migration become read-only legacy records.
-- Safe to run more than once.

-- ===================== AUCTIONS =====================

-- Added by 007_auction_points.sql, which some databases never received.
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS max_players_per_team INT NOT NULL DEFAULT 16;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'auctions' AND column_name = 'is_legacy') THEN
    ALTER TABLE auctions ADD COLUMN is_legacy BOOLEAN NOT NULL DEFAULT FALSE;
    UPDATE auctions SET is_legacy = TRUE;
  END IF;
END $$;

-- Optional link to a cricket tournament; its registrations form the player pool.
-- RESTRICT: a tournament with an auction cannot be deleted (archive it instead).
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS event_id INT REFERENCES events(event_id) ON DELETE RESTRICT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS min_players_per_team INT NOT NULL DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS min_bid_increment INT NOT NULL DEFAULT 100;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS default_base_price INT NOT NULL DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS rules TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS current_lot_id INT;
-- Incremented by every live change; clients use it to detect missed updates.
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE auctions ALTER COLUMN status SET DEFAULT 'DRAFT';

-- Legacy rows keep their original UPCOMING status.
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS chk_auctions_status;
ALTER TABLE auctions ADD CONSTRAINT chk_auctions_status CHECK (
  status IN ('DRAFT', 'READY', 'LIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')
  OR (is_legacy AND status = 'UPCOMING')
);

ALTER TABLE auctions DROP CONSTRAINT IF EXISTS chk_auctions_amounts;
ALTER TABLE auctions ADD CONSTRAINT chk_auctions_amounts CHECK (
  budget_per_team >= 0
  AND min_bid_increment > 0
  AND default_base_price >= 0
  AND max_players_per_team >= 1
  AND min_players_per_team BETWEEN 0 AND max_players_per_team
);

-- A season can hold several auctions (one per tournament); each tournament has at most one.
ALTER TABLE auctions DROP CONSTRAINT IF EXISTS auctions_season_id_key;
CREATE INDEX IF NOT EXISTS idx_auctions_season ON auctions (season_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_auctions_event ON auctions (event_id) WHERE event_id IS NOT NULL;

-- ===================== CATEGORIES (per auction) =====================

CREATE TABLE IF NOT EXISTS auction_categories (
    auction_category_id SERIAL PRIMARY KEY,
    auction_id          INT NOT NULL REFERENCES auctions(auction_id) ON DELETE CASCADE,
    name                VARCHAR(50) NOT NULL,
    display_order       INT NOT NULL DEFAULT 0,
    base_price          INT CHECK (base_price >= 0),
    min_per_team        INT NOT NULL DEFAULT 0 CHECK (min_per_team >= 0),
    max_per_team        INT CHECK (max_per_team IS NULL OR max_per_team >= min_per_team),
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_auction_categories_name ON auction_categories (auction_id, lower(name));

-- ===================== TEAMS & BUDGETS (per auction) =====================

-- Spending is derived from sold lots; budget changes are recorded in auction_events.
CREATE TABLE IF NOT EXISTS auction_teams (
    auction_id  INT NOT NULL REFERENCES auctions(auction_id) ON DELETE CASCADE,
    team_id     INT NOT NULL REFERENCES teams(team_id) ON DELETE RESTRICT,
    budget      INT NOT NULL CHECK (budget >= 0),
    max_players INT NOT NULL CHECK (max_players >= 1),
    added_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (auction_id, team_id)
);

-- ===================== PLAYER POOL =====================

-- RESTRICT: members with auction history cannot be deleted.
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(user_id) ON DELETE RESTRICT;
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS registration_id INT
    REFERENCES tournament_registrations(registration_id) ON DELETE SET NULL;
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS auction_category_id INT
    REFERENCES auction_categories(auction_category_id) ON DELETE RESTRICT;
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS is_eligible BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS eligibility_note VARCHAR(300);
-- Reopening a lot starts a new round; bids from earlier rounds stay in history but no longer count.
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS bid_round INT NOT NULL DEFAULT 1;
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS current_bid_id BIGINT;
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS sold_bid_id BIGINT;
ALTER TABLE auction_lots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS chk_auction_lots_status;
ALTER TABLE auction_lots ADD CONSTRAINT chk_auction_lots_status CHECK (
  status IN ('PENDING', 'ON_BLOCK', 'SOLD', 'UNSOLD', 'WITHDRAWN')
);

ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS chk_auction_lots_amounts;
ALTER TABLE auction_lots ADD CONSTRAINT chk_auction_lots_amounts CHECK (
  base_price >= 0 AND (sold_price IS NULL OR sold_price >= 0) AND bid_round >= 1
);

ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS chk_auction_lots_sold;
ALTER TABLE auction_lots ADD CONSTRAINT chk_auction_lots_sold CHECK (
  status <> 'SOLD' OR (team_id IS NOT NULL AND sold_price IS NOT NULL)
);

-- A sold player keeps their team: teams with purchases cannot be deleted.
ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS auction_lots_team_id_fkey;
ALTER TABLE auction_lots ADD CONSTRAINT auction_lots_team_id_fkey
    FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE RESTRICT;

-- Deferrable so the running order can be rearranged in one transaction.
ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS auction_lots_auction_id_lot_number_key;
ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS uq_auction_lots_number;
ALTER TABLE auction_lots ADD CONSTRAINT uq_auction_lots_number
    UNIQUE (auction_id, lot_number) DEFERRABLE INITIALLY IMMEDIATE;

-- A member appears once per auction, and only one player is under the hammer at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_auction_lots_member ON auction_lots (auction_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_auction_lots_on_block ON auction_lots (auction_id) WHERE status = 'ON_BLOCK';
CREATE INDEX IF NOT EXISTS idx_auction_lots_status ON auction_lots (auction_id, status);
CREATE INDEX IF NOT EXISTS idx_auction_lots_user ON auction_lots (user_id);

ALTER TABLE auctions DROP CONSTRAINT IF EXISTS fk_auctions_current_lot;
ALTER TABLE auctions ADD CONSTRAINT fk_auctions_current_lot
    FOREIGN KEY (current_lot_id) REFERENCES auction_lots(lot_id) ON DELETE SET NULL;

-- ===================== BIDS (permanent) =====================

CREATE TABLE IF NOT EXISTS auction_bids (
    bid_id      BIGSERIAL PRIMARY KEY,
    auction_id  INT NOT NULL REFERENCES auctions(auction_id) ON DELETE RESTRICT,
    lot_id      INT NOT NULL REFERENCES auction_lots(lot_id) ON DELETE RESTRICT,
    bid_round   INT NOT NULL CHECK (bid_round >= 1),
    team_id     INT NOT NULL REFERENCES teams(team_id) ON DELETE RESTRICT,
    amount      INT NOT NULL CHECK (amount >= 0),
    placed_by   INT REFERENCES users(user_id) ON DELETE RESTRICT,
    placed_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lot_id, bid_round, amount)
);

CREATE INDEX IF NOT EXISTS idx_auction_bids_lot ON auction_bids (lot_id, bid_round, amount DESC);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_time ON auction_bids (auction_id, placed_at);
CREATE INDEX IF NOT EXISTS idx_auction_bids_team ON auction_bids (team_id);

ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS fk_auction_lots_current_bid;
ALTER TABLE auction_lots ADD CONSTRAINT fk_auction_lots_current_bid
    FOREIGN KEY (current_bid_id) REFERENCES auction_bids(bid_id) ON DELETE RESTRICT;
ALTER TABLE auction_lots DROP CONSTRAINT IF EXISTS fk_auction_lots_sold_bid;
ALTER TABLE auction_lots ADD CONSTRAINT fk_auction_lots_sold_bid
    FOREIGN KEY (sold_bid_id) REFERENCES auction_bids(bid_id) ON DELETE RESTRICT;

-- ===================== EVENT HISTORY / AUDIT (permanent) =====================

-- Every lifecycle change, bid, sale, reopen, budget change and admin action, in order.
-- seq equals auctions.version after the change, so clients can resume from the last seq they saw.
CREATE TABLE IF NOT EXISTS auction_events (
    auction_event_id BIGSERIAL PRIMARY KEY,
    auction_id       INT NOT NULL REFERENCES auctions(auction_id) ON DELETE RESTRICT,
    seq              BIGINT NOT NULL,
    event_type       VARCHAR(40) NOT NULL,
    lot_id           INT REFERENCES auction_lots(lot_id) ON DELETE RESTRICT,
    team_id          INT REFERENCES teams(team_id) ON DELETE RESTRICT,
    bid_id           BIGINT REFERENCES auction_bids(bid_id) ON DELETE RESTRICT,
    amount           INT,
    details          JSONB NOT NULL DEFAULT '{}',
    actor_user_id    INT REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (auction_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_auction_events_lot ON auction_events (lot_id);

CREATE OR REPLACE FUNCTION kpl_reject_auction_history_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Auction history in % is permanent and cannot be changed (%).', TG_TABLE_NAME, TG_OP;
END $$;

DROP TRIGGER IF EXISTS trg_auction_bids_permanent ON auction_bids;
CREATE TRIGGER trg_auction_bids_permanent BEFORE UPDATE OR DELETE ON auction_bids
    FOR EACH ROW EXECUTE FUNCTION kpl_reject_auction_history_change();
DROP TRIGGER IF EXISTS trg_auction_bids_no_truncate ON auction_bids;
CREATE TRIGGER trg_auction_bids_no_truncate BEFORE TRUNCATE ON auction_bids
    FOR EACH STATEMENT EXECUTE FUNCTION kpl_reject_auction_history_change();

DROP TRIGGER IF EXISTS trg_auction_events_permanent ON auction_events;
CREATE TRIGGER trg_auction_events_permanent BEFORE UPDATE OR DELETE ON auction_events
    FOR EACH ROW EXECUTE FUNCTION kpl_reject_auction_history_change();
DROP TRIGGER IF EXISTS trg_auction_events_no_truncate ON auction_events;
CREATE TRIGGER trg_auction_events_no_truncate BEFORE TRUNCATE ON auction_events
    FOR EACH STATEMENT EXECUTE FUNCTION kpl_reject_auction_history_change();

-- ===================== PERMISSIONS =====================

INSERT INTO permissions (permission_code, permission_name, module, description) VALUES
('auctions:read', 'Read Auctions', 'auctions', 'View auction setup, player pools, budgets and reports'),
('auctions:manage', 'Manage Auctions', 'auctions', 'Create and configure auctions, player pools and team budgets; reopen sales; cancel auctions'),
('auctions:operate', 'Operate Live Auctions', 'auctions', 'Run live bidding: put players up, record bids, mark sold or unsold')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND p.permission_code IN ('auctions:read', 'auctions:manage', 'auctions:operate')
ON CONFLICT DO NOTHING;
