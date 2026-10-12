-- Events shown in the public "Events" menu, managed from the admin panel
-- (010_categories_and_archive.sql extends this table to also hold tournaments)

CREATE TABLE IF NOT EXISTS events (
    event_id      SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    slug          VARCHAR(220) NOT NULL UNIQUE,
    description   TEXT,
    event_date    DATE,
    venue         VARCHAR(200),
    image_url     VARCHAR(2000),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional last day for multi-day events; NULL means a single-day event
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date DATE;

INSERT INTO permissions (permission_code, permission_name, module) VALUES
('events:read', 'Read Events', 'events'),
('events:write', 'Write Events', 'events')
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_code IN ('SUPER_ADMIN', 'ADMIN')
  AND p.permission_code IN ('events:read', 'events:write')
ON CONFLICT DO NOTHING;
