# KPL API Reference

Base URL: `http://localhost:3001/api`

## Authentication

### POST `/auth/register`

```json
// Request
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "SecurePass1!"
}

// Response 201
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "user_id": 1, "email": "rahul@example.com", "roles": ["PLAYER"] },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  },
  "timestamp": "2026-06-18T12:00:00.000Z"
}
```

### POST `/auth/login`

```json
// Request
{ "email": "admin@kpl.local", "password": "Kpl@Admin2026" }

// Response 200
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "user_id": 1, "email": "admin@kpl.local", "roles": ["SUPER_ADMIN"] },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### POST `/auth/refresh`

```json
{ "refreshToken": "eyJhbG..." }
```

### GET `/auth/me`

Headers: `Authorization: Bearer <accessToken>`

---

## Users

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/users` | `users:read` | List users (paginated) |
| GET | `/users/:id` | `users:read` | Get user by ID |

Query: `?limit=50&offset=0`

---

## Roles

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/roles` | `roles:read` |
| GET | `/roles/permissions` | `permissions:read` |

---

## Teams & Players

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/teams` | `teams:read` |
| GET | `/teams/:id` | `teams:read` |
| GET | `/players` | `players:read` |
| GET | `/players/:id` | `players:read` |

---

## Tournaments & Matches

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/tournaments` | `tournaments:read` |
| GET | `/matches` | `matches:read` |
| GET | `/matches/:id` | `matches:read` |

---

## Scoring

### GET `/scoring/live/:matchId`

Public — live scoreboard for a match.

### POST `/scoring/:matchId/ball`

Permission: `scoring:live`

```json
{
  "inningsId": 1,
  "overNumber": 5,
  "ballNumber": 3,
  "batsmanId": 12,
  "bowlerId": 8,
  "runs": 4,
  "extras": 0,
  "wicketType": null,
  "isLegalDelivery": true
}
```

---

## Statistics

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/stats/points-table?seasonId=1` | Optional |
| GET | `/stats/players` | Optional |
| GET | `/stats/teams` | Optional |

---

## Dashboard

### GET `/dashboard/summary`

Permission: `dashboard:read`

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalTeams": 8,
    "liveMatches": 2,
    "totalTournaments": 1
  }
}
```

---

## Health

`GET /api/health` — API health check

---

## Auth Header

All protected endpoints:

```
Authorization: Bearer <accessToken>
```
