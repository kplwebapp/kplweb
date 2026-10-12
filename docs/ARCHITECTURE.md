# KPL Architecture

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Public Website   │  │ Admin (/admin)   │  │ Future Mobile App      │ │
│  │ frontend:5173    │  │ frontend:5173    │  │ (REST API consumer)    │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────┬───────────┘ │
└───────────┼─────────────────────┼─────────────────────────┼─────────────┘
            │                     │                         │
            └─────────────────────┼─────────────────────────┘
                                  │ HTTPS / REST + JWT
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER                                │
│  Express 5 │ Helmet │ CORS │ Rate Limit │ Compression │ Morgan           │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                      FEATURE MODULES (backend/src/modules)               │
│  auth │ users │ roles │ teams │ players │ tournaments │ matches          │
│  scoring │ statistics │ dashboard │ notifications                        │
│                                                                          │
│  Pattern per module: routes → controller → service → repository          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ pg Pool
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PostgreSQL 16                                    │
│  RBAC │ Teams/Players │ Tournaments/Seasons │ Matches/Scoring/Stats     │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Monorepo Layout

| Package | Purpose | Port |
|---------|---------|------|
| `@kpl/frontend` | Public site + admin panel at `/admin` | 5173 |
| `@kpl/backend` | REST API, auth, business logic | 3001 |
| `@kpl/shared` | Roles, permissions, API route constants | — |

## 3. Backend Module Architecture

Each feature lives in `backend/src/modules/<name>/`:

```
modules/auth/
├── auth.routes.js       # Express router, middleware chain
├── auth.controller.js   # HTTP request/response handling
├── auth.service.js      # Business logic
├── auth.repository.js   # SQL queries (pg)
└── auth.validation.js   # Joi schemas
```

**Request flow:**

```
HTTP Request
  → security middleware (helmet, rate limit)
  → authenticate (JWT)
  → authorize (permission check)
  → validate (Joi)
  → controller
  → service
  → repository
  → PostgreSQL
```

## 4. RBAC Architecture

```
users ──< user_roles >── roles ──< role_permissions >── permissions
```

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | All permissions |
| `ADMIN` | Tournament, user, team, match management |
| `TEAM_MANAGER` | Team roster & player registration |
| `SCORER` | Live ball-by-ball scoring |
| `PLAYER` | Self-service profile, view stats |
| `VIEWER` | Public read-only access |

**Middleware usage:**

```js
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { PERMISSIONS } = require('@kpl/shared');

router.post('/:matchId/ball',
  authenticate,
  authorize(PERMISSIONS.SCORING_LIVE),
  validate(recordBallSchema),
  scoringController.recordBall
);
```

`SUPER_ADMIN` bypasses permission checks. Other roles resolve permissions from `role_permissions` table at runtime.

## 5. Database Domains

| Domain | Tables |
|--------|--------|
| Identity | `users`, `roles`, `permissions`, `user_roles`, `role_permissions` |
| Competition | `tournaments`, `seasons`, `teams`, `players`, `team_players` |
| Matches | `matches`, `innings`, `overs`, `balls`, `scorecards` |
| Standings | `points_table`, `player_stats`, `team_stats` |
| Media | `gallery`, `sponsors`, `contact_messages` |
| System | `notifications`, `audit_logs` |

## 6. Frontend Architecture

```
frontend/src/
├── routes/           # React Router config
├── layouts/          # MainLayout, auth layouts
├── pages/            # Route-level pages
├── auth/             # Login, Register
├── components/       # Reusable UI (common/, Header, Footer)
├── contexts/         # AuthContext (Context API)
├── services/api/     # ApiClient, authApi, publicApi
├── hooks/            # Custom hooks (extend here)
└── styles/           # SCSS variables, themes
```

**State management:** Context API for auth. Redux Toolkit can be added for live scoring state if needed.

## 7. Admin Architecture

```
admin/src/
├── config/sidebar.ts     # Navigation + permission mapping
├── layouts/              # DashboardLayout (sidebar + outlet)
├── components/           # ProtectedRoute, ModulePage
├── pages/                # Feature pages (extend per module)
└── services/             # API layer (mirror frontend)
```

Protected routes check `accessToken` in localStorage. Production should add token refresh and role-based sidebar filtering.

## 8. Scalability Considerations

| Concern | Approach |
|---------|----------|
| Multiple tournaments | `tournaments` + `seasons` hierarchy |
| Live scoring | Transactional ball inserts; WebSocket layer (Socket.io) as Phase 2 |
| Mobile app | Same REST API + JWT |
| File uploads | Multer → local `uploads/`; migrate to S3 for production |
| Caching | Redis for live scores / points table (Phase 2) |
| Search | PostgreSQL full-text or Elasticsearch for players/teams |

## 9. Security Layers

1. **Transport:** HTTPS in production
2. **Headers:** Helmet
3. **Rate limiting:** Auth endpoints + global limit
4. **Input validation:** Joi on all write endpoints
5. **Auth:** JWT access + refresh tokens
6. **Authorization:** RBAC middleware on protected routes
7. **SQL:** Parameterized queries only (pg `$1, $2`)
8. **Uploads:** Type/size validation via Multer

## 10. Error Response Standard

```json
{
  "success": false,
  "message": "Human-readable error",
  "errors": [{ "field": "email", "message": "Invalid email" }],
  "timestamp": "2026-06-18T12:00:00.000Z"
}
```

HTTP status codes: `400` validation, `401` auth, `403` forbidden, `404` not found, `409` conflict, `500` server error.
