# TaskFlow

A full-stack task management platform (React + Express + MongoDB Atlas), built as a hands-on **Cloud and DevOps learning project**. The app is intentionally small; the point is to deploy it yourself on AWS EC2, then containerize it, then automate it.

- **Stage 1 (ready):** manual deployment on Ubuntu EC2 with Node.js, PM2 and Nginx. See [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md).
- **Stages 2-4 (roadmap):** Docker, Docker Compose, GitHub Actions CI/CD, DevSecOps and monitoring. See [docs/ROADMAP.md](docs/ROADMAP.md).

> **No automated tests are included** in this version, by choice (the goal is learning deployment). Linting and a production build are available. The roadmap says where tests would be added in CI.

---

## 1. Features

- Register, log in, log out, view your profile (JWT in an HttpOnly cookie)
- Create, view, edit and delete tasks; one-click status change
- Status: Pending, In Progress, Completed. Priority: Low, Medium, High. Optional due date
- Search by title, filter by status and priority, sort by created date or due date, pagination
- Dashboard: total, pending, in-progress, completed, high-priority (open) and recent tasks, all computed from the database
- Responsive SaaS-style UI with loading, error and empty states, toasts and confirmation before deleting

## 2. Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Tailwind CSS 3 (JavaScript only) |
| Backend | Node.js 20+, Express 4, Mongoose, JWT, bcryptjs, zod, helmet, cors, express-rate-limit, morgan |
| Database | MongoDB Atlas |
| Deployment (Stage 1) | AWS EC2 (Ubuntu), Nginx, PM2 |
| Later stages | Docker, Docker Compose, GitHub Actions, GHCR, CloudWatch |

## 3. Architecture

```
Browser
   |
   v
EC2 public IP / domain
   |
   v
Nginx :80 / :443
   |-- /            -> React build (static files in /var/www/taskflow)
   |-- /api/*       -> Express on 127.0.0.1:5000 (managed by PM2)
                          |
                          v
                     MongoDB Atlas
```

Key decisions:

- **One origin.** Nginx serves the UI and proxies `/api`, so the browser sees a single origin. That makes HttpOnly cookies simple (`SameSite=Lax`) and removes CORS from the production path. In development the Vite dev server proxies `/api` to the backend, which gives the same shape.
- **Relative API URL.** The frontend always calls `/api/v1`, so the same build works locally, behind Nginx, and later in Docker.
- **Layered backend.** route -> validator -> controller -> service -> model. `app.js` builds the app, `server.js` starts it (database connection, listening, graceful shutdown).
- **Stateless API, env-only config, logs to stdout.** This is what makes the later Docker and CloudWatch steps easy.

## 4. Repository structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/        env.js (validated env vars), db.js (Mongo connection)
│   │   ├── controllers/   HTTP layer
│   │   ├── middleware/    auth, validate, sanitize, csrfGuard, rateLimiters, errorHandler
│   │   ├── models/        User.js, Task.js
│   │   ├── routes/        /api/v1 route definitions
│   │   ├── services/      business logic (auth, tasks, dashboard)
│   │   ├── utils/         ApiError, logger, cookies, helpers
│   │   ├── validators/    zod schemas
│   │   ├── app.js
│   │   └── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    layout/, ui/, tasks/, dashboard/
│   │   ├── context/       AuthContext, ToastContext
│   │   ├── hooks/         useTasks, useDebounce
│   │   ├── pages/         Login, Register, Dashboard, Tasks, Profile, NotFound
│   │   ├── routes/        AppRouter, ProtectedRoute
│   │   ├── services/      axios instance and API modules
│   │   └── utils/
│   └── .env.example
├── deploy/
│   ├── nginx/taskflow.conf
│   ├── pm2/ecosystem.config.cjs
│   └── scripts/           deploy.sh, smoke.sh
├── docs/                  AWS_DEPLOYMENT.md, ROADMAP.md
└── .gitignore
```

## 5. Prerequisites

- Node.js 20 or newer (22 recommended) and npm
- Git
- A free MongoDB Atlas account

## 6. Database setup (MongoDB Atlas)

1. Create a free **M0** cluster at <https://cloud.mongodb.com>.
2. **Database Access** -> add a database user (username + password) with the *Read and write to any database* role.
3. **Network Access** -> add your current IP address for local development. (For EC2 you will add the server's Elastic IP later. Avoid `0.0.0.0/0` except for quick experiments.)
4. **Connect** -> *Drivers* -> copy the connection string, put your database name in it (for example `.../taskflow?retryWrites=true&w=majority`).
5. If your password contains special characters such as `@` or `#`, URL-encode them.

Collections and indexes are created automatically by Mongoose on first start.

## 7. Environment configuration

**Backend** (`backend/.env`, copy from `backend/.env.example`):

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `HOST` | Interface to bind. `127.0.0.1` on EC2 (private behind Nginx), `0.0.0.0` inside Docker |
| `NODE_ENV` | `development` or `production` |
| `TRUST_PROXY` | Number of proxies in front of the app (0 locally, 1 behind Nginx) |
| `MONGODB_URI` | Atlas connection string (required) |
| `JWT_SECRET` | At least 32 random characters (required). The server refuses to start otherwise |
| `JWT_EXPIRES_IN` | e.g. `1d`; also used as the cookie lifetime |
| `COOKIE_SECURE` | `true` only when the site is served over HTTPS |
| `FRONTEND_URL` | Comma-separated allowed browser origins for CORS (matters only for cross-origin development) |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**Frontend** (`frontend/.env`, optional): `VITE_API_BASE_URL=/api/v1`. Only public values belong here, because everything prefixed with `VITE_` ends up in the browser bundle.

## 8. Run locally

```bash
# 1) Backend
cd backend
cp .env.example .env        # then edit MONGODB_URI and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000/api/v1/health

# 2) Frontend (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Open <http://localhost:5173>, register an account and create a few tasks.

## 9. Scripts

| Where | Script | Purpose |
|---|---|---|
| backend | `npm run dev` | Start with nodemon (auto-reload) |
| backend | `npm start` | Production start |
| backend | `npm run lint` | ESLint |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build into `frontend/dist` |
| frontend | `npm run preview` | Serve the production build locally |
| frontend | `npm run lint` | ESLint |

## 10. API documentation

Base path: `/api/v1`. All bodies are JSON. Successful responses use `{ "success": true, "data": ... }`; errors use `{ "success": false, "message": "...", "errors": [{ "field", "message" }] }`.

**CSRF header:** every `POST`, `PATCH` and `DELETE` must include `X-Requested-With: XMLHttpRequest` (the frontend adds it automatically). When using curl or Postman, add it yourself, and keep the cookie jar (`curl -c jar -b jar`) or enable cookies in Postman.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | no | Liveness and database status. 200 when healthy, 503 when the database is down |
| POST | `/auth/register` | no | Create an account and start a session. 201; 409 if the email exists |
| POST | `/auth/login` | no | Start a session. 401 with a generic message on bad credentials |
| POST | `/auth/logout` | no | Clear the session cookie (idempotent) |
| GET | `/auth/me` | yes | Current user |
| POST | `/tasks` | yes | Create a task. 201 |
| GET | `/tasks` | yes | List your tasks (query below) |
| GET | `/tasks/:id` | yes | One task. 404 if missing **or not yours** |
| PATCH | `/tasks/:id` | yes | Partial update (also used for status changes) |
| DELETE | `/tasks/:id` | yes | Delete a task |
| GET | `/dashboard/stats` | yes | Counts and the 5 most recent tasks |

`POST /auth/register` body: `{ "name": "Aman", "email": "aman@example.com", "password": "Passw0rdOK" }` (password: 8-72 chars, at least one letter and one number).

`POST /tasks` body: `{ "title": "Write report", "description": "optional", "status": "pending", "priority": "high", "dueDate": "2026-12-01" }`. Only `title` is required. `dueDate` may be `null` to clear it.

`GET /tasks` query parameters:

| Param | Values | Default |
|---|---|---|
| `search` | text matched against the title (case-insensitive) | none |
| `status` | `pending`, `in_progress`, `completed` | all |
| `priority` | `low`, `medium`, `high` | all |
| `sortBy` | `createdAt`, `dueDate` (tasks without a due date always sort last) | `createdAt` |
| `order` | `asc`, `desc` | `desc` |
| `page`, `limit` | positive integers, `limit` max 50 | 1, 10 |

Example list response:

```json
{
  "success": true,
  "data": {
    "tasks": [{ "id": "...", "title": "Write report", "status": "pending", "priority": "high",
                "dueDate": "2026-12-01T00:00:00.000Z", "userId": "...", "createdAt": "...", "updatedAt": "..." }],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

Dashboard response: `{ "stats": { "total", "pending", "inProgress", "completed", "highPriority", "recentTasks": [...] } }`. `highPriority` counts high-priority tasks that are not completed yet.

Try it with curl:

```bash
curl -i -c jar -H 'Content-Type: application/json' -H 'X-Requested-With: XMLHttpRequest' \
  -d '{"name":"Test User","email":"test@example.com","password":"Passw0rd1"}' \
  http://localhost:5000/api/v1/auth/register

curl -b jar http://localhost:5000/api/v1/auth/me
```

## 11. Database schema

**users**: `name` (2-50), `email` (unique, lowercase), `passwordHash` (bcrypt, 12 rounds, hidden from queries and JSON), `createdAt`, `updatedAt`.

**tasks**: `title` (1-120), `description` (max 2000), `status` (enum), `priority` (enum), `dueDate` (nullable), `userId` (ObjectId -> users), `createdAt`, `updatedAt`.

Relationship: one user has many tasks. Indexes on tasks: `{userId, createdAt}`, `{userId, status}`, `{userId, priority}`, `{userId, dueDate}`; `users.email` is unique. Every task query includes `userId`, so ownership is enforced inside the database query and one user can never read or change another user's task.

## 12. Security summary

- Passwords hashed with bcrypt; hashes never returned; login takes similar time for unknown and known emails
- JWT in an **HttpOnly, SameSite=Lax** cookie (optionally `Secure`); no tokens in localStorage
- CSRF: SameSite plus a required custom header on state-changing requests
- Helmet headers, CORS allow-list, auth rate limiting (20 per 15 min per IP) plus a general API limit
- zod validation with unknown fields rejected, `$`/`.` key stripping against NoSQL injection, 10 KB body limit
- Central error handler: no stack traces or internals in production responses
- `JWT_SECRET` must be 32+ characters or the server will not start
- Secrets only in environment variables; `.env` files are git-ignored

**Known limitations:** JWTs are stateless, so logout removes the cookie but cannot revoke a token that was already copied elsewhere (it expires after `JWT_EXPIRES_IN`). There is no email verification or password reset. No automated tests are included.

## 13. Build

```bash
cd frontend
npm run build      # output in frontend/dist (static files, served by Nginx in production)
```

## 14. Deploy on AWS EC2 (Stage 1)

Follow [docs/AWS_DEPLOYMENT.md](docs/AWS_DEPLOYMENT.md). Summary: launch an Ubuntu instance, open ports 22 (your IP only), 80 and 443, install Node, Nginx and PM2, clone the repo, create `backend/.env`, build the frontend, start the API with PM2, enable the Nginx site, and verify with `deploy/scripts/smoke.sh`.

**Important:** keep `COOKIE_SECURE=false` while the site is on plain HTTP. Browsers refuse to store `Secure` cookies over HTTP, so login would appear to succeed and then fail. Switch it to `true` once HTTPS is configured.

## 15. Docker, CI/CD and DevSecOps roadmap

Described in [docs/ROADMAP.md](docs/ROADMAP.md), including Docker readiness notes, a GitHub Actions implementation roadmap (CI and CD separated, rollback design), and which security checks belong in CI versus the runtime environment. No Dockerfiles or workflows are included yet on purpose, so that you build and understand them yourself.
