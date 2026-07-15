# LogicLens Drive (DAM)

An internal Digital Asset Management system that turns Google Drive into a searchable, taggable, permission-aware company asset library. Google Drive remains the source of truth for files; this application stores and manages searchable metadata on top of it.

📄 See [`docs/API.md`](docs/API.md) for the full API reference and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for system design and database schema.

---

## Screenshot
 
![LogicLens Drive login](./docs/screenshots/login.png)  
![LogicLens Drive product grid](./docs/screenshots/demo.png) 

---

## Features


### For authenticated users
- Full product CRUD (create, edit, delete)
- Sync a product's Drive folder — recursively flattens nested subfolders into a single file list
- Edit file metadata: title, description, remarks, category, tags, visibility (public/private)
- Manage categories and tags
- Recycle Bin — soft-delete and restore files
- Private files are automatically hidden from guest search, preview, and download

### Platform
- JWT authentication with rotating refresh tokens and role-based access control (Admin / Employee)
- New account registration is restricted to existing Admins
- Fully containerized (Docker Compose): PostgreSQL, NestJS backend, Next.js frontend

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form, Zod |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL, accessed via Prisma ORM |
| Auth | JWT access + refresh tokens, RBAC |
| Storage | Google Drive API (metadata-only; files never touch our database) |
| Deployment | Docker Compose |
| Package manager | pnpm |

---

## Project structure

```
logiclens-drive/
├── backend/          NestJS API
├── frontend/         Next.js app
├── docker/           docker-compose.yml and related config
├── docs/             API.md, ARCHITECTURE.md, screenshots
└── scripts/          One-off dev/maintenance scripts
```

---

## Getting started

### Prerequisites
- Node.js 24.x
- pnpm (via `corepack enable`)
- Docker Desktop
- A Google Cloud service account with Drive API access (see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#google-drive-integration) for setup)

## Demo Environment

### Frontend
- Import the repo in vercel
- Deploy in vercel as Nest.js app
- Also configure the backend api named 'NEXT_PUBLIC_API_URL' with backend web service render url
```
NEXT_PUBLIC_API_URL=https://logiclens-drive-vercel-deploy.onrender.com
```

### Backend
- Make a new webservice in Render
- Import repo in render
- Keep your setting in backend like this 
![LogicLens Drive render settings](./docs/screenshots/render_settings.png)
![LogicLens Drive product grid](./docs/screenshots/demo.png)  
- Add all the env variables as like instructed below in local environment
- Add 'DATABASE_URL' which we got the postgres service in render

### Database - Postgres
- Make a new database on render
- Copy the External Database Url and paste it in backend 'DATABASE_URL'
- Also to make a new account, just follow the below steps in powershell
> $env:DATABASE_URL="<your_external_database_url>?sslmode=require"
> pnpm exec prisma studio

## Local or VPS Environment

### 1. Clone and configure environment variables

Copy the example env files and fill in real values:
```bash
cp backend/.env.example backend/.env
```

Required variables in `backend/.env`:
```
DATABASE_URL=postgresql://dam_user:dam_dev_password@localhost:5432/dam_db?schema=public
JWT_ACCESS_SECRET=<long random string>
JWT_REFRESH_SECRET=<different long random string>
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./google-service-account.json
```

> [!IMPORTANT] Important
> The database username, password and name is to be kept different from this in production

Place your downloaded Google service account key at `backend/google-service-account.json` (already gitignored).

Required variable in `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. Run everything with Docker (recommended)

```bash
docker compose -f docker/docker-compose.yml up --build
```
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000

### 3. Or run locally for active development

Start just the database in Docker, run backend/frontend locally with live-reload:
```bash
docker compose -f docker/docker-compose.yml up postgres
```
```bash
# in backend/
pnpm install
pnpm exec prisma migrate dev
pnpm run start:dev
```
```bash
# in frontend/
pnpm install
pnpm run dev
```

### 4. Create your first admin account

Registration is admin-only by design. Bootstrap the first account directly in the database:
```bash
# in backend/, with the API running
pnpm exec prisma studio
```
Register a user via `POST /auth/register` once, then manually set that user's `role` to `ADMIN` in Prisma Studio.

---

## Known limitations

- Currently not any backend for registering a new account is there, but made on frontend
- Refresh tokens are stored in `localStorage` on the frontend (currently for demo; a production hardening pass should move to httpOnly cookies)
- Currently not able to upload as it is running on a service account which is provided zero storage from google, To upload currently it is required to have the google drive we added as a shared folder otherwise have to implement oAuth to upload.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#known-limitations) for details and suggested fixes.