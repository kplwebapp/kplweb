# KPL Deployment Guide

## 1. Environments

| Environment | Frontend | API | Database |
|-------------|----------|-----|----------|
| Development | localhost:5173 (site + /admin) | localhost:3001 | localhost:5432 |
| Staging | staging.kpl.example (/admin) | api-staging.kpl.example | Managed PG |
| Production | www.kpl.example (/admin) | api.kpl.example | Managed PG |

## 2. Docker (Recommended)

```bash
# Copy env files
cp backend/.env.example backend/.env
# Edit JWT secrets and DB password

docker compose up -d --build

# Run migrations inside API container or host
npm run db:migrate
npm run db:seed
```

Services:
- **postgres** — PostgreSQL 16
- **api** — Express backend
- **frontend** — Nginx serving built SPA
- **admin** — Nginx serving admin SPA

## 3. Manual VPS Deployment

### PostgreSQL

```bash
sudo apt install postgresql-16
sudo -u postgres createuser kpl_user -P
sudo -u postgres createdb kpl_db -O kpl_user
npm run db:migrate && npm run db:seed
```

### Backend (PM2)

```bash
cd backend
cp .env.example .env
npm install
pm2 start src/server.js --name kpl-api
pm2 save
```

### Frontends

```bash
cd frontend && npm run build
cd ../admin && npm run build
# Serve dist/ via Nginx with SPA fallback
```

### Nginx snippet

```nginx
server {
  listen 80;
  server_name api.kpl.example;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```

## 4. Environment Variables (Production)

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | Yes | 64+ char random string |
| `JWT_REFRESH_SECRET` | Yes | Different from JWT_SECRET |
| `DB_PASSWORD` | Yes | Strong password |
| `CORS_ORIGINS` | Yes | Exact production URLs |
| `NODE_ENV` | Yes | `production` |

## 5. CI/CD (GitHub Actions)

See `.github/workflows/ci.yml`:

1. Checkout
2. Install workspaces
3. Lint frontend
4. Build all packages
5. (Extend) Run tests, deploy to staging

**Recommended pipeline:**

```
PR → lint + test + build
main → deploy staging
tag v* → deploy production
```

## 6. File Uploads

Development: `uploads/` directory (bind-mounted in Docker).

Production: Replace Multer disk storage with S3/Cloudinary adapter in `middleware/upload.js`.

## 7. SSL/TLS

Use Let's Encrypt (Certbot) or cloud load balancer TLS termination.

## 8. Monitoring

| Tool | Purpose |
|------|---------|
| PM2 / Docker healthchecks | Process uptime |
| `/api/health` | Load balancer health |
| Sentry | Error tracking |
| Datadog / Grafana | Metrics & logs |

## 9. Backups

```bash
pg_dump -h localhost -U kpl_user kpl_db > backup_$(date +%F).sql
```

Schedule daily backups with retention policy.

## 10. Security Checklist

- [ ] Rotate JWT secrets
- [ ] Restrict CORS to production domains
- [ ] Enable HTTPS only
- [ ] Remove default seed admin or change password
- [ ] Set `DB_PASSWORD` and never commit `.env`
- [ ] Configure firewall (API only via reverse proxy)
- [ ] Enable audit_logs for admin actions
