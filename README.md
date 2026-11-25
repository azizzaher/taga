# Taga

AI gym assistant. React + Vite front end, Node.js + Express back end (`api/`), PostgreSQL on Supabase, hosted on Vercel.

## Back-end routes

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/api/health` | no | Health check |
| POST | `/api/auth/register` | no | Create login + profile, set token cookie |
| POST | `/api/auth/login` | no | Log in, set token cookie |
| GET | `/api/auth/me` | yes | Current user + profile |
| POST | `/api/auth/logout` | no | Clear token cookie |
| GET | `/api/admin/user-count` | admin | Role check example |
| GET | `/api/plans` | yes | All three plans (lose fat, maintain weight, build muscle) |
| GET | `/api/plans/:goal` | yes | One plan: `lose_fat`, `maintain_weight`, `build_muscle` |
| POST | `/api/plans/:goal/apply` | yes | Save plan as daily targets and fitness goal |

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. Never commit `.env.local`.

- `DATABASE_URL`: Supabase pooler connection string (port 6543)
- `JWT_SECRET`: random string, at least 32 characters

## Run locally

```
npm install express pg bcryptjs jsonwebtoken cookie-parser
npm install -g vercel
vercel dev
```

Your package.json must contain `"type": "module"`.
