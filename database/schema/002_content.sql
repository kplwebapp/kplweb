-- CMS tables for public site content managed via admin

CREATE TABLE site_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE page_content (
    page_slug     VARCHAR(50) PRIMARY KEY,
    content       JSONB NOT NULL DEFAULT '{}',
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default site settings
INSERT INTO site_settings (setting_key, setting_value) VALUES
('league_name', 'Kansara Premier League'),
('contact_email', 'info@kpl.local'),
('current_season', 'KPL Season 2026'),
('public_website_url', 'http://localhost:5173'),
('contact_location', 'Kansara Community Grounds')
ON CONFLICT (setting_key) DO NOTHING;

-- About page content
INSERT INTO page_content (page_slug, content) VALUES
('about', '{
  "title": "About Kansara Premier League",
  "introduction": "A community cricket tournament celebrating talent, teamwork, and the spirit of the game.",
  "mission": "To bring together players and fans through competitive, inclusive cricket events.",
  "vision": "To grow KPL into a premier community league with professional standards and lasting impact.",
  "community": "Built by the community, for the community — every match, every season, every story."
}'::jsonb)
ON CONFLICT (page_slug) DO NOTHING;

-- Sample gallery items
INSERT INTO gallery (title, image_url, caption, category) VALUES
('Match Day Action', 'https://placehold.co/600x400/2563eb/ffffff?text=Match+Day+Action', 'KPL Season 2026 opener', 'Matches'),
('Team Celebrations', 'https://placehold.co/600x400/2563eb/ffffff?text=Team+Celebrations', 'Victory moments', 'Events'),
('Award Ceremony', 'https://placehold.co/600x400/2563eb/ffffff?text=Award+Ceremony', 'Season highlights', 'Events'),
('Training Session', 'https://placehold.co/600x400/2563eb/ffffff?text=Training+Session', 'Behind the scenes', 'Behind the Scenes');
