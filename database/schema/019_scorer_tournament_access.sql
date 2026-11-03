-- Scorers need to open tournament pages to use the Scores tab.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.role_code = 'SCORER'
  AND p.permission_code = 'tournaments:read'
ON CONFLICT DO NOTHING;
