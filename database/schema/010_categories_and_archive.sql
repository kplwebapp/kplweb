-- Admin-managed categories for tournaments (Cricket, Carrom, ...) and events (Seminars, Funfair, ...).
-- The events table now holds both kinds; rows are archived instead of deleted.

CREATE TABLE IF NOT EXISTS activity_categories (
    category_id   SERIAL PRIMARY KEY,
    kind          VARCHAR(20) NOT NULL CHECK (kind IN ('TOURNAMENT', 'EVENT')),
    name          VARCHAR(100) NOT NULL,
    slug          VARCHAR(120) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kind, slug)
);

INSERT INTO activity_categories (kind, name, slug, display_order) VALUES
('TOURNAMENT', 'Cricket', 'cricket', 1),
('TOURNAMENT', 'Carrom', 'carrom', 2),
('TOURNAMENT', 'Chess', 'chess', 3),
('TOURNAMENT', 'Singing', 'singing', 4),
('TOURNAMENT', 'Drawing', 'drawing', 5),
('EVENT', 'Seminars', 'seminars', 1),
('EVENT', 'Funfair', 'funfair', 2),
('EVENT', 'Picnic', 'picnic', 3)
ON CONFLICT (kind, slug) DO NOTHING;

ALTER TABLE events ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'EVENT';
ALTER TABLE events ADD COLUMN IF NOT EXISTS category_id INT REFERENCES activity_categories(category_id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'events' AND column_name = 'is_active') THEN
    UPDATE events SET is_archived = TRUE, archived_at = COALESCE(archived_at, CURRENT_TIMESTAMP)
    WHERE is_active = FALSE;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_events_active_order;
ALTER TABLE events DROP COLUMN IF EXISTS is_active;
ALTER TABLE events DROP COLUMN IF EXISTS display_order;

UPDATE events SET category_id = (
  SELECT category_id FROM activity_categories WHERE kind = 'EVENT' AND slug = 'seminars'
)
WHERE kind = 'EVENT' AND category_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_kind_category ON events (kind, category_id, is_archived);

CREATE TABLE IF NOT EXISTS tournament_registrations (
    registration_id SERIAL PRIMARY KEY,
    event_id        INT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, user_id)
);

-- Admins manage both tournaments and events with the existing permission codes
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND p.permission_code IN ('tournaments:read', 'tournaments:write', 'events:read', 'events:write')
ON CONFLICT DO NOTHING;
