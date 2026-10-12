-- KPL Seed Data
-- Default password for seeded users: Kpl@Admin2026 (bcrypt hash below)

-- Roles
INSERT INTO roles (role_code, role_name, description) VALUES
('SUPER_ADMIN', 'Super Admin', 'Full system access'),
('ADMIN', 'Admin', 'Tournament and user administration'),
('TEAM_MANAGER', 'Team Manager', 'Manage team roster and registrations'),
('SCORER', 'Scorer', 'Live match scoring'),
('PLAYER', 'Player', 'Registered player'),
('VIEWER', 'Viewer', 'Read-only public access')
ON CONFLICT (role_code) DO NOTHING;

-- Permissions (subset — extend as needed)
INSERT INTO permissions (permission_code, permission_name, module) VALUES
('users:read', 'Read Users', 'users'),
('users:write', 'Write Users', 'users'),
('users:delete', 'Delete Users', 'users'),
('roles:read', 'Read Roles', 'roles'),
('roles:write', 'Write Roles', 'roles'),
('permissions:read', 'Read Permissions', 'roles'),
('teams:read', 'Read Teams', 'teams'),
('teams:write', 'Write Teams', 'teams'),
('players:read', 'Read Players', 'players'),
('players:write', 'Write Players', 'players'),
('players:register', 'Register Players', 'players'),
('tournaments:read', 'Read Tournaments', 'tournaments'),
('tournaments:write', 'Write Tournaments', 'tournaments'),
('seasons:read', 'Read Seasons', 'tournaments'),
('seasons:write', 'Write Seasons', 'tournaments'),
('matches:read', 'Read Matches', 'matches'),
('matches:write', 'Write Matches', 'matches'),
('scoring:read', 'Read Scoring', 'scoring'),
('scoring:write', 'Write Scoring', 'scoring'),
('scoring:live', 'Live Scoring', 'scoring'),
('stats:read', 'Read Statistics', 'stats'),
('stats:write', 'Write Statistics', 'stats'),
('dashboard:read', 'Read Dashboard', 'dashboard'),
('reports:read', 'Read Reports', 'dashboard'),
('gallery:read', 'Read Gallery', 'media'),
('gallery:write', 'Write Gallery', 'media'),
('sponsors:read', 'Read Sponsors', 'media'),
('sponsors:write', 'Write Sponsors', 'media'),
('events:read', 'Read Events', 'events'),
('events:write', 'Write Events', 'events'),
('notifications:read', 'Read Notifications', 'notifications'),
('notifications:write', 'Write Notifications', 'notifications'),
('settings:read', 'Read Settings', 'system'),
('settings:write', 'Write Settings', 'system'),
('audit:read', 'Read Audit Logs', 'system')
ON CONFLICT (permission_code) DO NOTHING;

-- Assign all permissions to SUPER_ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r CROSS JOIN permissions p
WHERE r.role_code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code = 'ADMIN'
  AND p.permission_code IN (
    'users:read','users:write','roles:read','teams:read','teams:write',
    'players:read','players:write','tournaments:read','tournaments:write',
    'seasons:read','seasons:write','matches:read','matches:write',
    'scoring:read','scoring:write','stats:read','stats:write',
    'dashboard:read','reports:read','gallery:read','gallery:write',
    'sponsors:read','sponsors:write','events:read','events:write',
    'notifications:read','notifications:write','settings:read','audit:read'
  )
ON CONFLICT DO NOTHING;

-- Scorer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_code = 'SCORER' AND p.permission_code IN ('matches:read','scoring:read','scoring:write','scoring:live','stats:read','dashboard:read')
ON CONFLICT DO NOTHING;

-- Viewer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_code = 'VIEWER' AND p.permission_code IN ('teams:read','players:read','tournaments:read','matches:read','scoring:read','stats:read','gallery:read','sponsors:read')
ON CONFLICT DO NOTHING;

-- Super admin user (password: Kpl@Admin2026)
INSERT INTO users (first_name, last_name, full_name, email, password_hash, is_active, email_verified)
VALUES (
  'KPL', 'Admin', 'KPL Admin', 'admin@kpl.local',
  '$2a$12$2Bugh455KFXAq0gfPLPW/OzKuD7mKloRdxw0xjXuBMtSLjvO0Ob5O',
  TRUE, TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u, roles r
WHERE u.email = 'admin@kpl.local' AND r.role_code = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Sample tournament data
INSERT INTO tournaments (tournament_name, tournament_code, format, description) VALUES
('Kansara Premier League', 'KPL', 'T20', 'Annual community cricket tournament')
ON CONFLICT (tournament_code) DO NOTHING;

INSERT INTO seasons (tournament_id, season_name, season_year, start_date, end_date, status)
SELECT tournament_id, 'KPL Season 1', 2023, '2023-01-15', '2023-04-30', 'COMPLETED'
FROM tournaments WHERE tournament_code = 'KPL'
ON CONFLICT (tournament_id, season_year) DO NOTHING;

INSERT INTO seasons (tournament_id, season_name, season_year, start_date, end_date, status)
SELECT tournament_id, 'KPL Season 2', 2024, '2024-01-15', '2024-04-30', 'COMPLETED'
FROM tournaments WHERE tournament_code = 'KPL'
ON CONFLICT (tournament_id, season_year) DO NOTHING;

INSERT INTO seasons (tournament_id, season_name, season_year, start_date, end_date, status)
SELECT tournament_id, 'KPL Season 3', 2025, '2025-03-01', '2025-06-30', 'COMPLETED'
FROM tournaments WHERE tournament_code = 'KPL'
ON CONFLICT (tournament_id, season_year) DO NOTHING;

INSERT INTO seasons (tournament_id, season_name, season_year, start_date, end_date, status)
SELECT tournament_id, 'KPL Season 4', 2026, '2025-11-01', '2026-02-28', 'ONGOING'
FROM tournaments WHERE tournament_code = 'KPL'
ON CONFLICT (tournament_id, season_year) DO NOTHING;

INSERT INTO teams (team_name, team_code, short_name) VALUES
('Valsad Warriors', 'VWA', 'Warriors'),
('Omisol Champions', 'OCH', 'Champions'),
('Super Strikers', 'SST', 'Strikers'),
('Friends Cricketers', 'FRC', 'Cricketers'),
('Mahakali Tigers', 'MTK', 'Tigers'),
('Fearless Falcons', 'FFC', 'Falcons')
ON CONFLICT (team_name) DO NOTHING;

INSERT INTO points_table (season_id, team_id, matches_played, matches_won, matches_lost, matches_tied, matches_nr, points, net_run_rate)
SELECT s.season_id, t.team_id, v.played, v.won, v.lost, v.tied, v.nr, v.pts, v.nrr
FROM seasons s
JOIN (VALUES
  ('VWA', 8, 6, 2, 0, 0, 12, 1.120),
  ('OCH', 8, 5, 3, 0, 0, 10, 0.540),
  ('MTK', 8, 4, 4, 0, 0, 8, 0.210),
  ('SST', 8, 3, 5, 0, 0, 6, -0.320),
  ('FFC', 8, 3, 5, 0, 0, 6, -0.450),
  ('FRC', 8, 2, 6, 0, 0, 4, -1.100)
) AS v(team_code, played, won, lost, tied, nr, pts, nrr) ON TRUE
JOIN teams t ON t.team_code = v.team_code
WHERE s.season_year = 2023
ON CONFLICT (season_id, team_id) DO NOTHING;

INSERT INTO points_table (season_id, team_id, matches_played, matches_won, matches_lost, matches_tied, matches_nr, points, net_run_rate)
SELECT s.season_id, t.team_id, v.played, v.won, v.lost, v.tied, v.nr, v.pts, v.nrr
FROM seasons s
JOIN (VALUES
  ('OCH', 10, 7, 3, 0, 0, 14, 1.230),
  ('VWA', 10, 6, 4, 0, 0, 12, 0.870),
  ('FFC', 10, 6, 4, 0, 0, 12, 0.410),
  ('MTK', 10, 5, 5, 0, 0, 10, -0.080),
  ('SST', 10, 4, 6, 0, 0, 8, -0.560),
  ('FRC', 10, 3, 7, 0, 0, 6, -1.020)
) AS v(team_code, played, won, lost, tied, nr, pts, nrr) ON TRUE
JOIN teams t ON t.team_code = v.team_code
WHERE s.season_year = 2024
ON CONFLICT (season_id, team_id) DO NOTHING;

INSERT INTO points_table (season_id, team_id, matches_played, matches_won, matches_lost, matches_tied, matches_nr, points, net_run_rate)
SELECT s.season_id, t.team_id, v.played, v.won, v.lost, v.tied, v.nr, v.pts, v.nrr
FROM seasons s
JOIN (VALUES
  ('VWA', 8, 7, 1, 0, 0, 14, 1.820),
  ('OCH', 8, 5, 3, 0, 0, 10, 0.650),
  ('FRC', 8, 4, 4, 0, 0, 8, -0.110),
  ('SST', 8, 2, 6, 0, 0, 4, -1.340),
  ('MTK', 8, 3, 5, 0, 0, 6, -0.540),
  ('FFC', 8, 4, 4, 0, 0, 8, 0.120)
) AS v(team_code, played, won, lost, tied, nr, pts, nrr) ON TRUE
JOIN teams t ON t.team_code = v.team_code
WHERE s.season_year = 2025
ON CONFLICT (season_id, team_id) DO NOTHING;

INSERT INTO points_table (season_id, team_id, matches_played, matches_won, matches_lost, matches_tied, matches_nr, points, net_run_rate)
SELECT s.season_id, t.team_id, v.played, v.won, v.lost, v.tied, v.nr, v.pts, v.nrr
FROM seasons s
JOIN (VALUES
  ('OCH', 4, 3, 1, 0, 0, 6, 1.120),
  ('VWA', 4, 3, 1, 0, 0, 6, 0.780),
  ('MTK', 4, 2, 2, 0, 0, 4, 0.150),
  ('SST', 3, 1, 2, 0, 0, 2, -0.340),
  ('FFC', 3, 1, 2, 0, 0, 2, -0.520),
  ('FRC', 3, 0, 3, 0, 0, 0, -1.450)
) AS v(team_code, played, won, lost, tied, nr, pts, nrr) ON TRUE
JOIN teams t ON t.team_code = v.team_code
WHERE s.season_year = 2026
ON CONFLICT (season_id, team_id) DO NOTHING;

-- Sample matches for Season 4 (2026)
INSERT INTO matches (season_id, team1_id, team2_id, venue, match_date, status, result_summary)
SELECT s.season_id, t1.team_id, t2.team_id, v.venue, v.match_date::timestamp, v.status, v.result_summary
FROM seasons s
JOIN (VALUES
  ('VWA', 'OCH', 'KPL Ground A', '2026-03-08 14:00:00', 'COMPLETED', 'Valsad Warriors won by 24 runs'),
  ('OCH', 'SST', 'KPL Ground B', '2026-03-09 14:00:00', 'COMPLETED', 'Omisol Champions won by 6 wickets'),
  ('VWA', 'OCH', 'KPL Ground A', '2026-03-15 14:00:00', 'LIVE', NULL),
  ('SST', 'FRC', 'KPL Ground B', '2026-03-16 14:00:00', 'SCHEDULED', NULL),
  ('MTK', 'FFC', 'KPL Ground A', '2026-03-22 14:00:00', 'SCHEDULED', NULL)
) AS v(team1_code, team2_code, venue, match_date, status, result_summary) ON TRUE
JOIN teams t1 ON t1.team_code = v.team1_code
JOIN teams t2 ON t2.team_code = v.team2_code
WHERE s.season_year = 2026
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE m.season_id = s.season_id
      AND m.team1_id = t1.team_id
      AND m.team2_id = t2.team_id
      AND m.match_date = v.match_date::timestamp
  );

-- Innings for the live sample match (Season 4)
INSERT INTO innings (match_id, batting_team_id, bowling_team_id, innings_number, total_runs, total_wickets, total_overs, status)
SELECT m.match_id, m.team1_id, m.team2_id, 1, 142, 4, 15.2, 'IN_PROGRESS'
FROM matches m
JOIN seasons s ON s.season_id = m.season_id
WHERE s.season_year = 2026 AND m.status = 'LIVE'
ON CONFLICT (match_id, innings_number) DO NOTHING;

INSERT INTO innings (match_id, batting_team_id, bowling_team_id, innings_number, total_runs, total_wickets, total_overs, status)
SELECT m.match_id, m.team2_id, m.team1_id, 2, 98, 6, 12.0, 'IN_PROGRESS'
FROM matches m
JOIN seasons s ON s.season_id = m.season_id
WHERE s.season_year = 2026 AND m.status = 'LIVE'
ON CONFLICT (match_id, innings_number) DO NOTHING;

INSERT INTO sponsors (sponsor_name, tier, display_order) VALUES
('Title Sponsor', 'TITLE', 1),
('Gold Partner', 'GOLD', 2),
('Silver Partner', 'SILVER', 3);
