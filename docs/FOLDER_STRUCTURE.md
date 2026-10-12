# KPL Folder Structure

```
kplweb/
│
├── frontend/                          # @kpl/frontend — Public website + admin
│   ├── public/
│   ├── src/
│   │   ├── admin/                     # Admin panel (mounted at /admin)
│   │   │   ├── config/                # sidebar.ts
│   │   │   ├── components/            # ProtectedRoute, PageHeader
│   │   │   ├── layouts/               # DashboardLayout
│   │   │   ├── pages/                 # Dashboard, Matches, Scoring, etc.
│   │   │   └── styles/
│   │   ├── auth/                      # Login, Register, Logout
│   │   ├── components/
│   │   │   ├── common/                # PageShell, AppToast
│   │   │   ├── Header/
│   │   │   ├── Footer/
│   │   │   └── Topbar/
│   │   ├── content/                   # YAML static page copy
│   │   ├── contexts/                  # AuthContext
│   │   ├── layouts/                   # MainLayout, LoginRegisterLayout
│   │   ├── pages/                     # Home, About, Profile, etc.
│   │   ├── routes/                    # AppRouter, AdminRoutes
│   │   ├── services/api/              # ApiClient, authApi, publicApi
│   │   └── styles/
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                           # @kpl/backend — REST API
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/                   # auth, users, matches, scoring, stats, etc.
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── server.js                      # Compatibility entry → src/server.js
│   ├── .env.example
│   └── package.json
│
├── shared/                            # @kpl/shared — Cross-package constants
│   └── constants/
│
├── database/
│   ├── schema/                        # 001_init.sql, migrations 002+
│   └── seeds/
│
├── uploads/                           # Multer upload destination
├── scripts/                           # migrate.js, seed.js, apply-*.js
├── docs/
├── docker/
│   ├── Dockerfile.api
│   └── Dockerfile.frontend
├── docker-compose.yml
├── .github/workflows/ci.yml
└── package.json
```

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Module folder | lowercase singular | `auth`, `scoring` |
| Module files | `{module}.{layer}.js` | `auth.service.js` |
| DB tables | snake_case plural | `team_players` |
| API routes | kebab-case plural | `/api/live-scores` |
| Permissions | `resource:action` | `scoring:live` |
| Roles | SCREAMING_SNAKE | `TEAM_MANAGER` |
| React components | PascalCase | `DashboardLayout.tsx` |
| Env vars | SCREAMING_SNAKE | `JWT_SECRET` |
