-- Tournament details: participating teams, match results (feed the points table) and a photo/video gallery.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS tournament_teams (
    event_id    INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    team_id     INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, team_id)
);

CREATE TABLE IF NOT EXISTS tournament_matches (
    match_id        SERIAL PRIMARY KEY,
    event_id        INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    team1_id        INT NOT NULL REFERENCES teams(team_id),
    team2_id        INT NOT NULL REFERENCES teams(team_id),
    match_date      DATE,
    stage           VARCHAR(20) NOT NULL DEFAULT 'LEAGUE'
                    CHECK (stage IN ('LEAGUE', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL')),
    status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED'
                    CHECK (status IN ('SCHEDULED', 'COMPLETED', 'NO_RESULT')),
    result          VARCHAR(10) CHECK (result IN ('TEAM1', 'TEAM2', 'TIE')),
    team1_runs      INT CHECK (team1_runs >= 0),
    team1_wickets   INT CHECK (team1_wickets BETWEEN 0 AND 10),
    team1_overs     NUMERIC(5,1) CHECK (team1_overs >= 0),
    team2_runs      INT CHECK (team2_runs >= 0),
    team2_wickets   INT CHECK (team2_wickets BETWEEN 0 AND 10),
    team2_overs     NUMERIC(5,1) CHECK (team2_overs >= 0),
    summary         VARCHAR(300),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (team1_id <> team2_id),
    CHECK ((status = 'COMPLETED') = (result IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_event ON tournament_matches(event_id);

CREATE TABLE IF NOT EXISTS tournament_media (
    media_id    SERIAL PRIMARY KEY,
    event_id    INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    media_type  VARCHAR(10) NOT NULL CHECK (media_type IN ('PHOTO', 'VIDEO')),
    url         TEXT NOT NULL,
    youtube_id  VARCHAR(20),
    caption     VARCHAR(300),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK ((media_type = 'VIDEO') = (youtube_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_tournament_media_event ON tournament_media(event_id, media_type);
