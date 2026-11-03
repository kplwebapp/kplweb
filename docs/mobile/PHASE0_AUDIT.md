# KPL Mobile — Phase 0 Repository Audit

**Date:** 2026-10-29  
**Scope:** Read-only inspection of `E:/Projects/KPL/Application/kplweb`  
**Branch:** `main` (aligned with `origin/main`)  
**Status:** Verified facts vs proposed work are labeled below.

---

## 1. Existing architecture summary (verified)

| Layer | Location | Stack |
|-------|----------|--------|
| Public website + admin | `frontend/` | React 19, Vite, TypeScript, Bootstrap, SCSS |
| REST API | `backend/` | Node.js, Express 5, Joi, JWT, Multer, `pg` |
| Shared constants | `shared/` | Roles, permissions |
| Schema / seeds | `database/schema`, `database/seeds` | PostgreSQL migrations via `scripts/migrate.js` |
| Uploads | `uploads/` (served at `/uploads`) | Local filesystem |
| Docs | `docs/` | Architecture, API, deployment |

**API mount:** `API_PREFIX` default `/api` on port `3001`.  
**Clients today:** Public site (`:5173`) and admin (`/admin`). Architecture docs already name a future mobile client as a REST consumer.

**Monorepo workspaces:** `frontend`, `backend`, `shared` only. No `mobile/` package existed at audit time (`E:/Projects/KPL/MobileApp` is an empty sibling folder).

**Auth (verified):** JWT access + refresh; middleware `authenticate` / `optionalAuth`; RBAC via `roles` + `permissions`. Documented roles include `SUPER_ADMIN`, `ADMIN`, `TEAM_MANAGER`, `SCORER`, `PLAYER`, `VIEWER`.

**Brand colors (verified from `frontend/src/styles/variables.scss`):** Primary `#000066`, secondary/hover `#0052FF`, accent gold `#FFD700`, light page bg `#f5f7fb` / `#F8FAFC`, dark surfaces around `#0B1026` / `#121A3A`. Logo assets: `frontend/src/assets/img-logo.png`, `img-logo-white.png`.

---

## 2. Reusable components and services (verified)

| Asset | Reuse for mobile |
|-------|------------------|
| Backend modules (routes → controller → service → repository) | Consume via HTTP only; do not import Node modules into the app |
| `@kpl/shared` permission/role codes | Mirror as TypeScript types in mobile when auth is added (Phase 5+) |
| Auction public snapshot + SSE stream | Strong candidate for live auction UI |
| Statistics endpoints (`/stats/seasons`, `/stats/points-table`, …) | Prefer these over re-implementing standings math |
| Scoring live endpoint `GET /scoring/live/:matchId` | Live scoreboard when data exists |
| Upload URLs under `/uploads` | Absolute URL = API host + path; never embed DB credentials |
| Website cricket formatting / auction text utils | Port carefully into `mobile/src/utils` (do not share via fragile monorepo coupling in Phase 1) |

Website-only (not a second backend): Bootstrap UI, admin DashboardLayout, YAML page content (`frontend/src/content`).

---

## 3. Existing API inventory (verified from route modules)

Base: `/api`

### Public / anonymous-friendly (code-verified)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Health |
| POST | `/auth/register`, `/auth/login`, `/auth/refresh` | Also legacy `/register`, `/login` |
| GET | `/auctions/public` | Auction cards |
| GET | `/auctions/:auctionId/public` | Live snapshot |
| GET | `/auctions/:auctionId/stream` | SSE |
| GET | `/gallery` | Public gallery |
| GET | `/sponsors` | Public sponsors |
| GET | `/events` | Activities list (query validated) |
| GET | `/events/slug/:slug` | Activity by slug |
| GET | `/events/slug/:slug/details` | Tournament public details |
| GET | `/categories` | Public categories |
| GET | `/pages/:slug` | CMS pages (about, etc.) |
| GET | `/settings/public` | Public settings |
| POST | `/contact` | Contact form |
| GET | `/scoring/live/:matchId` | Live score |
| GET | `/matches`, `/matches/:id` | `optionalAuth` — readable without token |
| GET | `/stats/seasons`, `/stats/points-table`, `/stats/players`, `/stats/teams` | `optionalAuth` |

### Auth required (blocking for anonymous mobile browse)

| Method | Path | Gate |
|--------|------|------|
| GET | `/teams`, `/teams/:id` | `authenticate` + `teams:read` |
| GET | `/players`, `/players/:id` | `authenticate` + `players:read` |
| GET | `/tournaments` | Auth + permission (CRUD module) |
| GET | `/notifications` | Auth + permission |
| Most `/auctions/manage/*`, scoring writes, dashboard, users, roles | Staff |

**Note:** `docs/API.md` is partially outdated (e.g. matches documented as permission-gated; route code uses `optionalAuth`). Prefer route source of truth.

### Website vs API

| Feature | Website | Working API for mobile? |
|---------|---------|-------------------------|
| Home marketing sections | Yes | Partial (stats, sponsors, gallery, events) |
| Teams page | Static fixture list in UI | **No public teams list** |
| Auction board | Yes | Yes (`/auctions/public`, snapshot, SSE) |
| Points table | Yes (home + admin) | Yes (`/stats/points-table`) |
| Match scoring admin | Yes | Writes auth-only; live GET public |
| Gallery / sponsors / about | Yes | Yes |
| Profile / registration | Yes | Auth + profile routes |

---

## 4. Database entities relevant to mobile (verified)

From `database/schema` (esp. `001_init.sql`, auctions `006`/`013`/`014`, content/events):

- **RBAC:** `users`, `roles`, `permissions`, `user_roles`, `role_permissions`
- **Competition:** `teams`, `players`, `team_players`, `tournaments`, `seasons`
- **Match:** `matches`, `innings`, `overs`, `balls`, `scorecards`
- **Standings / stats:** `points_table`, `player_stats`, `team_stats`
- **Media:** `sponsors`, gallery tables (content migrations), tournament media
- **Auction:** auction / lot / bid / event tables (management + image)
- **Activities:** events/tournaments unified activity model + categories

Authoritative production DB is Neon-hosted PostgreSQL. Mobile must never connect directly.

---

## 5. Missing mobile API capabilities (proposed gaps)

These are **proposals** based on Phase 2–4 needs, not implemented here:

1. **Public teams + squad** endpoints (or open selected fields of existing teams/players for anonymous read).
2. **Public season-scoped fixtures/results** shaped for cards (list filters: live / upcoming / completed) — matches list may need richer public DTOs (logos, innings summary).
3. **Public player profile** (safe fields only).
4. **CORS / Expo origins** for device and Expo Go hosts (config change, not schema).
5. **Push notification pipeline** (not present as mobile delivery; `/notifications` is admin-oriented).
6. **Optional:** compact home aggregate endpoint to reduce fan-out (seasons + featured match + standings preview).

Do **not** invent bidding from the mobile client; live sell/bid remains staff-operated via `/auctions/manage/.../live/*`.

---

## 6. Proposed safe implementation approach

1. Add **`mobile/`** as an **isolated** Expo (React Native) package — **not** in npm workspaces initially — so website `npm install` / GitHub Pages stay unchanged.
2. Phase 1: UI foundation + **marked preview fixtures** only.
3. Phase 2+: TanStack Query client → existing public APIs; document backend public-read extensions before coding them.
4. Env: `EXPO_PUBLIC_API_BASE_URL` only (no Neon/JWT secrets in the bundle).
5. Prefer `/stats/points-table` for standings; never fork NRR math.
6. No migrations, seeds, or production Neon changes during mobile UI work.

---

## 7. Security and deployment risks (verified + proposed)

| Risk | Notes |
|------|--------|
| Accidental Expo install at monorepo root | Observed during audit; reverted. Keep Expo deps inside `mobile/` only |
| Auth-gated teams/players | Mobile fan browse will fail until public APIs exist |
| JWT in SecureStore | Only after auth phase; refresh rotation must match backend |
| Upload / image hotlinking | CORS and CORP already special-cased for `/uploads` |
| SSE auction stream | Compression already skips `text/event-stream` |
| Admin surfaces in mobile | Out of scope for public app |
| Docs vs code drift | Treat route files as source of truth |

---

## Distinction reminder

- **Verified:** paths, middleware, schema tables, website brand tokens, workspace layout.  
- **Proposed:** new public endpoints, push, home aggregate, mobile folder structure and phases below.
