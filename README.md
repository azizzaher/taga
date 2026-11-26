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
| GET | `/api/food?date=YYYY-MM-DD` | yes | Food entries, totals, and targets for one day |
| POST | `/api/food` | yes | Log a food entry with calories and macros |
| DELETE | `/api/food/:id` | yes | Remove one of your food entries |

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. Never commit `.env.local`.

- `DATABASE_URL`: Supabase pooler connection string (port 6543)
- `JWT_SECRET`: random string, at least 32 characters

## Food tracker database

Run [`sql/food_tracker.sql`](./sql/food_tracker.sql) in the Supabase SQL Editor
before using the Food Tracker.

## Run locally

Copy `.env.example` to `.env.local` and set `DATABASE_URL` and `JWT_SECRET`.
Run the food tracker migration above, then start the API and front end in separate terminals:

```
npm run dev:api
```

```
npm run dev
```

Open the local URL printed by Vite. The API runs on port 3001 and Vite proxies
`/api` requests to it.

## Deploy on Vercel

Run the food tracker migration and add `DATABASE_URL` and `JWT_SECRET` to the
Vercel project's environment variables for the environments you will deploy.
Then run `npm run build` and `vercel --prod` from the repository root. The
Vercel account owner must enable two-factor authentication before deploying.
