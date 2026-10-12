-- Player auction per season

CREATE TABLE IF NOT EXISTS auctions (
    auction_id      SERIAL PRIMARY KEY,
    season_id       INT NOT NULL UNIQUE REFERENCES seasons(season_id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    auction_date    TIMESTAMPTZ,
    venue           VARCHAR(200),
    status          VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    budget_per_team NUMERIC(12, 2) DEFAULT 100000,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auction_lots (
    lot_id          SERIAL PRIMARY KEY,
    auction_id      INT NOT NULL REFERENCES auctions(auction_id) ON DELETE CASCADE,
    lot_number      INT NOT NULL,
    player_name     VARCHAR(200) NOT NULL,
    player_role     VARCHAR(50),
    vibhaag         VARCHAR(100),
    base_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sold_price      NUMERIC(12, 2),
    team_id         INT REFERENCES teams(team_id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sold_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (auction_id, lot_number)
);

CREATE INDEX IF NOT EXISTS idx_auction_lots_auction ON auction_lots(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_lots_team ON auction_lots(team_id);
