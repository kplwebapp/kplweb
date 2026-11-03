-- Admin panel entry permission + ensure only Super Admin can manage roles.

INSERT INTO permissions (permission_code, permission_name, module, description) VALUES
(
  'admin:access',
  'Access Admin Panel',
  'system',
  'Sign in to the admin panel and see the dashboard shell'
)
ON CONFLICT (permission_code) DO NOTHING;

-- Staff roles that already use the admin panel.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code IN ('SUPER_ADMIN', 'ADMIN', 'TEAM_MANAGER', 'SCORER')
  AND p.permission_code = 'admin:access'
ON CONFLICT DO NOTHING;

-- Role management stays Super Admin only.
DELETE FROM role_permissions rp
USING roles r, permissions p
WHERE rp.role_id = r.role_id
  AND rp.permission_id = p.permission_id
  AND r.role_code <> 'SUPER_ADMIN'
  AND p.permission_code IN ('roles:write', 'roles:read', 'permissions:read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'SUPER_ADMIN'
  AND p.permission_code IN ('roles:write', 'roles:read', 'permissions:read', 'admin:access')
ON CONFLICT DO NOTHING;
