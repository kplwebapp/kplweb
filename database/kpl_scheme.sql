-- ==========================================
-- KPL DATABASE SCHEMA
-- Kansara Premier League
-- ==========================================

-- USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,

    first_name VARCHAR(50) NOT NULL,
    middle_name VARCHAR(50),
    last_name VARCHAR(50) NOT NULL,

    full_name VARCHAR(200),

    vibhaag VARCHAR(100),

    gender VARCHAR(20),

    dob DATE,

    mobile VARCHAR(15) UNIQUE,
    email VARCHAR(100) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    city VARCHAR(100),
    address TEXT,

    occupation VARCHAR(100),

    profile_photo TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EVENTS TABLE
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,

    event_name VARCHAR(200) NOT NULL,

    event_type VARCHAR(50) NOT NULL,

    description TEXT,

    venue VARCHAR(200),

    start_date DATE,
    end_date DATE,

    registration_start_date DATE,
    registration_end_date DATE,

    max_participants INT,

    is_registration_open BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- EVENT REGISTRATIONS
CREATE TABLE registrations (
    registration_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

    event_id INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,

    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(20) DEFAULT 'Pending',

    UNIQUE(user_id, event_id)
);

-- CRICKET PLAYER PROFILE
CREATE TABLE cricket_profiles (
    cricket_profile_id SERIAL PRIMARY KEY,

    user_id INT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    batting_style VARCHAR(50),

    bowling_style VARCHAR(50),

    is_wicketkeeper BOOLEAN DEFAULT FALSE,

    tshirt_number INT,

    tshirt_name VARCHAR(50),

    tshirt_size VARCHAR(10),

    cricket_experience_years INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CHESS PLAYER PROFILE
CREATE TABLE chess_profiles (
    chess_profile_id SERIAL PRIMARY KEY,

    user_id INT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    chess_rating INT,

    experience_years INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CARROM PLAYER PROFILE
CREATE TABLE carrom_profiles (
    carrom_profile_id SERIAL PRIMARY KEY,

    user_id INT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    preferred_hand VARCHAR(20),

    experience_years INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CRICKET TEAMS
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,

    team_name VARCHAR(100) UNIQUE NOT NULL,

    captain_id INT
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    team_logo TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TEAM PLAYERS
CREATE TABLE team_players (
    team_player_id SERIAL PRIMARY KEY,

    team_id INT NOT NULL
        REFERENCES teams(team_id)
        ON DELETE CASCADE,

    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(team_id, user_id)
);

-- MATCHES (CRICKET)
CREATE TABLE matches (
    match_id SERIAL PRIMARY KEY,

    event_id INT
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    team1_id INT
        REFERENCES teams(team_id),

    team2_id INT
        REFERENCES teams(team_id),

    match_date TIMESTAMP,

    venue VARCHAR(200),

    winner_team_id INT
        REFERENCES teams(team_id),

    status VARCHAR(20) DEFAULT 'Scheduled'
);

-- ANNOUNCEMENTS
CREATE TABLE announcements (
    announcement_id SERIAL PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    event_id INT
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GALLERY
CREATE TABLE gallery (
    gallery_id SERIAL PRIMARY KEY,

    event_id INT
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    image_url TEXT NOT NULL,

    caption VARCHAR(255),

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CONTACT / INQUIRY FORM
CREATE TABLE contact_messages (
    contact_message_id SERIAL PRIMARY KEY,

    name VARCHAR(100),

    email VARCHAR(100),

    mobile VARCHAR(15),

    subject VARCHAR(200),

    message TEXT,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX idx_users_mobile
ON users(mobile);

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_registrations_user
ON registrations(user_id);

CREATE INDEX idx_registrations_event
ON registrations(event_id);

CREATE INDEX idx_events_type
ON events(event_type);

-- ==========================================
-- SAMPLE EVENT TYPES
--
-- Cricket
-- Chess
-- Carrom
-- Seminar
-- Picnic
-- Get Together
-- Cultural Event
-- Sports Day
-- Youth Festival
-- ==========================================