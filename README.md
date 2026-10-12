# Kansara Premier League (KPL) — Monorepo

Enterprise-grade cricket tournament management platform.

## Structure

```
kplweb/
├── frontend/          # Public website + admin panel (React + Vite) — port 5173
├── backend/           # REST API (Node + Express) — port 3001
├── shared/            # Roles, permissions, API constants
├── database/          # PostgreSQL schema & seeds
├── uploads/           # Multer file storage
├── scripts/           # migrate.js, seed.js
├── docs/              # Architecture, API, deployment guides
└── docker/            # Dockerfiles
```

## Quick Start

```bash
# Install all workspaces (single hoisted node_modules at repo root)
npm install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start PostgreSQL, then migrate & seed
npm run db:migrate
npm run db:seed

# Run API + frontend
npm run dev
```

**URLs:**
- Public site: http://localhost:5173
- Admin panel: http://localhost:5173/admin
- API: http://localhost:3001

**Default admin:** `admin@kpl.local` / `Kpl@Admin2026`

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Folder Structure](./docs/FOLDER_STRUCTURE.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, Bootstrap |
| Admin | React 19 (embedded at `/admin` in frontend) |
| Backend | Node.js, Express 5, JWT, Joi, Multer |
| Database | PostgreSQL 16 |
| Auth | JWT + RBAC |
