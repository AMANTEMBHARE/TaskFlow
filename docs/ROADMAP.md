# Roadmap: Docker, CI/CD, DevSecOps and Monitoring

Nothing in this file is implemented yet. There are no Dockerfiles and no GitHub Actions workflows in the repository on purpose: you will write them, and a pipeline should never be presented as working before it has actually been run. Tests were also left out of this version; the CI section shows where they plug in.

## Stage 2: Docker

### What already makes the code container-ready

| Property | Where it is |
|---|---|
| All configuration from environment variables | `backend/src/config/env.js` |
| Configurable port and bind address (`PORT`, `HOST`) | set `HOST=0.0.0.0` inside a container |
| Health endpoint for `HEALTHCHECK` | `GET /api/v1/health` (503 when the database is down) |
| Graceful shutdown on `SIGTERM` | `backend/src/server.js` |
| Logs written to stdout/stderr, JSON in production | `backend/src/utils/logger.js` |
| Stateless: no local files, no sessions in memory | whole backend |
| Relative API URL in the frontend | `VITE_API_BASE_URL=/api/v1` |
| Build output is plain static files | `frontend/dist` |

### Suggested design

```
EC2 -> Docker Engine -> Compose network
         |- web (Nginx image) : serves /usr/share/nginx/html, proxies /api -> http://api:5000
         '- api (Node image)  : not published to the host, reachable only by `web`
                                 -> MongoDB Atlas
```

- **Backend Dockerfile (multi-stage):** stage 1 installs production dependencies (`npm ci --omit=dev`); the final stage copies `node_modules` and `src`, runs as the non-root `node` user, sets `NODE_ENV=production`, `EXPOSE 5000` and a `HEALTHCHECK` that calls `/api/v1/health`. Use `node:22-alpine` or `node:22-slim`.
- **Frontend Dockerfile (multi-stage):** stage 1 `npm ci && npm run build`; stage 2 `nginx:alpine` copying `dist` plus a Nginx config adapted from `deploy/nginx/taskflow.conf` (`proxy_pass http://api:5000`).
- **`.dockerignore`:** `node_modules`, `.env*`, `.git`, `dist`, logs. This also stops secrets from being baked into images.
- **Compose:** `api` and `web` services, `env_file` for the backend variables (never `COPY` the `.env` into an image), `restart: unless-stopped`, `healthcheck`, `depends_on` with `condition: service_healthy`, only `web` publishes 80/443.
- **Things to learn here:** image layers and caching, why the build stage is discarded, container networking and DNS by service name, `docker logs`, why `HOST` must be `0.0.0.0` in a container.
- Keep PM2 out of the containers: Docker's restart policy already supervises the process.

## Stage 3: CI/CD with GitHub Actions

### Separate responsibilities

| Workflow | Trigger | Responsibility |
|---|---|---|
| `ci.yml` | every pull request and push | Prove the code is healthy. Never touches servers or secrets beyond reading the repo |
| `cd.yml` | push to `main` only (or a version tag) after CI is green | Build the release artifact, publish it, deploy it, verify it |

### CI job outline

1. Checkout; set up Node 22 with npm cache
2. `npm ci` in `backend` and `frontend`
3. `npm run lint` in both
4. Tests (once you add them: Jest + Supertest with `mongodb-memory-server` for the backend, Vitest for the frontend)
5. `npm run build` in `frontend`
6. Security checks that need no server (see the table below)

### CD job outline

1. Build the Docker images, tagged with the **commit SHA** (not only `latest`)
2. Scan the images (Trivy), fail on critical vulnerabilities
3. Push to **GHCR** using the built-in `GITHUB_TOKEN` (`permissions: packages: write`)
4. Deploy to EC2 over SSH (or AWS SSM): `docker compose pull && docker compose up -d` with the new SHA
5. Verify: poll `/api/v1/health`; if it fails, **roll back** by redeploying the previous SHA

### Safety rules to build in

- `on: push: branches: [main]` plus a GitHub **Environment** (`production`) with required reviewers if you want manual approval
- Credentials in GitHub **Secrets** (`EC2_HOST`, `EC2_SSH_KEY`, ...). Prefer a dedicated deploy user with a key that can do nothing else. For AWS API access prefer **OIDC** over long-lived access keys
- Never `echo` secrets; GitHub masks them but do not rely on it. Do not enable `set -x` in deploy steps
- Least privilege: `permissions:` set per workflow; pin third-party actions to a version (ideally a commit SHA)
- Rollback is easy only if old images stay available: keep the last few SHA-tagged images and record the currently deployed SHA on the server

## Stage 4: DevSecOps and monitoring

### What belongs where

| Check | Runs in | Why there |
|---|---|---|
| Lint, unit/integration tests, build | CI (every PR) | Fast feedback before merge |
| `npm audit --omit=dev` (fail on high/critical) | CI | Known-vulnerable dependencies, needs no server |
| Dependabot / dependency graph alerts | GitHub (continuous) | New CVEs appear after your last commit |
| Secret scanning + push protection (GitHub), optional gitleaks | GitHub / CI | Stop leaked secrets before they reach history |
| SAST (CodeQL) | CI on PR + weekly schedule | Finds insecure code patterns in source |
| Dockerfile / compose linting (hadolint) | CI | Static, cheap |
| Image vulnerability scan (Trivy) | CD, before publishing, and scheduled re-scan of the published image | Scans what you actually ship; new CVEs appear over time |
| Deployment health check, rollback | CD | Needs the real environment |
| Security group review, SSH hardening, patching (`unattended-upgrades`) | Runtime / AWS | Infrastructure, not code |
| Logs, metrics, alarms | Runtime (CloudWatch) | Only exists once the app runs |

### Monitoring plan (CloudWatch)

- Install the **CloudWatch agent** on EC2 with an IAM instance role (least privilege: `CloudWatchAgentServerPolicy`). The agent ships memory and disk metrics, which EC2 does not report by default
- Ship logs: PM2/Docker JSON logs from the API and Nginx access/error logs into log groups with a retention period (for example 14 days)
- Alarms: CPU, memory, disk usage, instance status check failed, and an external check on `/api/v1/health` (Route 53 health check or a CloudWatch Synthetics canary) notifying you through SNS email
- Practice troubleshooting: break things on purpose (stop PM2, block Atlas access, fill the disk) and learn to find the cause from logs and metrics

## Suggested order of learning

1. Finish Stage 1 on EC2 and understand each moving part (SSH, security group, Nginx, PM2, DNS, TLS)
2. Dockerize locally, then run the same stack with Compose on EC2
3. Write `ci.yml` first and get it green; add `cd.yml` only after the manual Docker deployment works
4. Add security scanning one tool at a time, fixing what each finds
5. Add CloudWatch last, when there is something running worth watching
