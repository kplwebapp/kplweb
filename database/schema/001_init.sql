-- ============================================================
-- Kansara Premier League (KPL) — Production PostgreSQL Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================== RBAC =====================

CREATE TABLE users (
    user_id         SERIAL PRIMARY KEY,
    first_name      VARCHAR(50) NOT NULL,
    middle_name     VARCHAR(50),
    last_name       VARCHAR(50) NOT NULL,
    full_name       VARCHAR(200),
    email           VARCHAR(100) UNIQUE NOT NULL,
    mobile          VARCHAR(15) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    gender          VARCHAR(20),
    dob             DATE,
    city            VARCHAR(100),
    address         TEXT,
    occupation      VARCHAR(100),
    vibhaag         VARCHAR(100),
    profile_photo   TEXT,
    is_active       BOOLEAN DEFAULT FALSE,
    email_verified  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    role_id     SERIAL PRIMARY KEY,
    role_code   VARCHAR(50) UNIQUE NOT NULL,
    role_name   VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id   SERIAL PRIMARY KEY,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(150) NOT NULL,
    module          VARCHAR(50) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id         INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id   INT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id     INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id     INT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- ===================== TEAMS & PLAYERS =====================

CREATE TABLE teams (
    team_id     SERIAL PRIMARY KEY,
    team_name   VARCHAR(100) UNIQUE NOT NULL,
    team_code   VARCHAR(10) UNIQUE,
    short_name  VARCHAR(50),
    captain_id  INT REFERENCES users(user_id) ON DELETE SET NULL,
    manager_id  INT REFERENCES users(user_id) ON DELETE SET NULL,
    team_logo   TEXT,
    home_ground VARCHAR(200),
    founded_year INT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE players (
    player_id           SERIAL PRIMARY KEY,
    user_id             INT UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    batting_style       VARCHAR(50),
    bowling_style       VARCHAR(50),
    player_role         VARCHAR(30),
    is_wicketkeeper     BOOLEAN DEFAULT FALSE,
    jersey_number       INT,
    jersey_name         VARCHAR(50),
    jersey_size         VARCHAR(10),
    experience_years    INT,
    registration_status VARCHAR(20) DEFAULT 'PENDING',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_players (
    team_player_id  SERIAL PRIMARY KEY,
    team_id         INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    player_id       INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    season_id       INT,
    joined_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active       BOOLEAN DEFAULT TRUE,
    UNIQUE (team_id, player_id, season_id)
);

-- ===================== TOURNAMENTS & SEASONS =====================

CREATE TABLE tournaments (
    tournament_id   SERIAL PRIMARY KEY,
    tournament_name VARCHAR(200) NOT NULL,
    tournament_code VARCHAR(50) UNIQUE,
    format          VARCHAR(50) DEFAULT 'T20',
    description     TEXT,
    logo_url        TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seasons (
    season_id       SERIAL PRIMARY KEY,
    tournament_id   INT NOT NULL REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
    season_name     VARCHAR(100) NOT NULL,
    season_year     INT NOT NULL,
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(20) DEFAULT 'UPCOMING',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, season_year)
);

ALTER TABLE team_players
    ADD CONSTRAINT fk_team_players_season
    FOREIGN KEY (season_id) REFERENCES seasons(season_id) ON DELETE SET NULL;

-- ===================== MATCHES & SCORING =====================

CREATE TABLE matches (
    match_id        SERIAL PRIMARY KEY,
    season_id       INT NOT NULL REFERENCES seasons(season_id) ON DELETE CASCADE,
    team1_id        INT NOT NULL REFERENCES teams(team_id),
    team2_id        INT NOT NULL REFERENCES teams(team_id),
    venue           VARCHAR(200),
    match_date      TIMESTAMP,
    match_type      VARCHAR(30) DEFAULT 'LEAGUE',
    overs_limit     INT DEFAULT 20,
    toss_winner_id  INT REFERENCES teams(team_id),
    toss_decision   VARCHAR(10),
    status          VARCHAR(20) DEFAULT 'SCHEDULED',
    winner_team_id  INT REFERENCES teams(team_id),
    result_summary  TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (team1_id <> team2_id)
);

CREATE TABLE innings (
    innings_id      SERIAL PRIMARY KEY,
    match_id        INT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    batting_team_id INT NOT NULL REFERENCES teams(team_id),
    bowling_team_id INT NOT NULL REFERENCES teams(team_id),
    innings_number  INT NOT NULL CHECK (innings_number IN (1, 2)),
    total_runs      INT DEFAULT 0,
    total_wickets   INT DEFAULT 0,
    total_overs     DECIMAL(5,1) DEFAULT 0,
    extras          INT DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'NOT_STARTED',
    UNIQUE (match_id, innings_number)
);

CREATE TABLE overs (
    over_id         SERIAL PRIMARY KEY,
    innings_id      INT NOT NULL REFERENCES innings(innings_id) ON DELETE CASCADE,
    over_number     INT NOT NULL,
    bowler_id       INT REFERENCES players(player_id),
    runs_conceded   INT DEFAULT 0,
    wickets_taken   INT DEFAULT 0,
    UNIQUE (innings_id, over_number)
);

CREATE TABLE balls (
    ball_id             SERIAL PRIMARY KEY,
    over_id             INT NOT NULL REFERENCES overs(over_id) ON DELETE CASCADE,
    ball_number         INT NOT NULL CHECK (ball_number BETWEEN 1 AND 6),
    batsman_id          INT REFERENCES players(player_id),
    bowler_id           INT REFERENCES players(player_id),
    runs                INT DEFAULT 0,
    extras              INT DEFAULT 0,
    extra_type          VARCHAR(20),
    wicket_type         VARCHAR(30),
    wicket_player_id    INT REFERENCES players(player_id),
    is_legal_delivery   BOOLEAN DEFAULT TRUE,
    commentary          TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (over_id, ball_number)
);

CREATE TABLE scorecards (
    scorecard_id    SERIAL PRIMARY KEY,
    match_id        INT NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    player_id       INT NOT NULL REFERENCES players(player_id),
    team_id         INT NOT NULL REFERENCES teams(team_id),
    innings_number  INT NOT NULL,
    runs_scored     INT DEFAULT 0,
    balls_faced     INT DEFAULT 0,
    fours           INT DEFAULT 0,
    sixes           INT DEFAULT 0,
    is_out          BOOLEAN DEFAULT FALSE,
    dismissal_type  VARCHAR(30),
    overs_bowled    DECIMAL(5,1) DEFAULT 0,
    runs_conceded   INT DEFAULT 0,
    wickets_taken   INT DEFAULT 0,
    maidens         INT DEFAULT 0,
    UNIQUE (match_id, player_id, innings_number)
);

-- ===================== STANDINGS & STATS =====================

CREATE TABLE points_table (
    points_table_id SERIAL PRIMARY KEY,
    season_id       INT NOT NULL REFERENCES seasons(season_id) ON DELETE CASCADE,
    team_id         INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    matches_played  INT DEFAULT 0,
    matches_won     INT DEFAULT 0,
    matches_lost    INT DEFAULT 0,
    matches_tied    INT DEFAULT 0,
    matches_nr      INT DEFAULT 0,
    points          INT DEFAULT 0,
    net_run_rate    DECIMAL(6,3) DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (season_id, team_id)
);

CREATE TABLE player_stats (
    player_stat_id  SERIAL PRIMARY KEY,
    player_id       INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    season_id       INT REFERENCES seasons(season_id) ON DELETE CASCADE,
    matches_played  INT DEFAULT 0,
    total_runs      INT DEFAULT 0,
    total_wickets   INT DEFAULT 0,
    strike_rate     DECIMAL(6,2) DEFAULT 0,
    economy_rate    DECIMAL(6,2) DEFAULT 0,
    highest_score   INT DEFAULT 0,
    best_bowling    VARCHAR(10),
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (player_id, season_id)
);

CREATE TABLE team_stats (
    team_stat_id    SERIAL PRIMARY KEY,
    team_id         INT NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    season_id       INT REFERENCES seasons(season_id) ON DELETE CASCADE,
    matches_played  INT DEFAULT 0,
    matches_won     INT DEFAULT 0,
    matches_lost    INT DEFAULT 0,
    total_runs      INT DEFAULT 0,
    total_wickets   INT DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_id, season_id)
);

-- ===================== MEDIA & SPONSORS =====================

CREATE TABLE sponsors (
    sponsor_id      SERIAL PRIMARY KEY,
    sponsor_name    VARCHAR(200) NOT NULL,
    logo_url        TEXT,
    website_url     TEXT,
    tier            VARCHAR(30) DEFAULT 'STANDARD',
    is_active       BOOLEAN DEFAULT TRUE,
    display_order   INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gallery (
    gallery_id      SERIAL PRIMARY KEY,
    season_id       INT REFERENCES seasons(season_id) ON DELETE SET NULL,
    match_id        INT REFERENCES matches(match_id) ON DELETE SET NULL,
    title           VARCHAR(200),
    image_url       TEXT NOT NULL,
    caption         TEXT,
    category        VARCHAR(50) DEFAULT 'GENERAL',
    uploaded_by     INT REFERENCES users(user_id) ON DELETE SET NULL,
    uploaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
    contact_message_id SERIAL PRIMARY KEY,
    name            VARCHAR(100),
    email           VARCHAR(100),
    mobile          VARCHAR(15),
    subject         VARCHAR(200),
    message         TEXT,
    status          VARCHAR(20) DEFAULT 'NEW',
    submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== NOTIFICATIONS & AUDIT =====================

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(user_id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(30) DEFAULT 'INFO',
    is_read         BOOLEAN DEFAULT FALSE,
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    audit_log_id    SERIAL PRIMARY KEY,
    user_id         INT REFERENCES users(user_id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       INT,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== INDEXES =====================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile ON users(mobile);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_innings_match ON innings(match_id);
CREATE INDEX idx_balls_over ON balls(over_id);
CREATE INDEX idx_scorecards_match ON scorecards(match_id);
CREATE INDEX idx_points_season ON points_table(season_id);
CREATE INDEX idx_player_stats_season ON player_stats(season_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
