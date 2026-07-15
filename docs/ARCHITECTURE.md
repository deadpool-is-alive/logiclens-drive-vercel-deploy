# Architecture — LogicLens Drive (DAM)

## System overview

```
Browser ── Next.js (frontend, :3001) ── NestJS API (backend, :3000) ── PostgreSQL
                                                  │
                                                  └── Google Drive API (metadata read + file streaming)
```

Google Drive is the source of truth for file *content*. PostgreSQL stores only metadata: product records, cached file metadata, categories, tags, users, and auth tokens. No file bytes are ever persisted in the database.

---

## Database schema

- **User** — email, password hash (bcrypt), role (`ADMIN` / `EMPLOYEE`)
- **RefreshToken** — SHA-256 hash of the token, revoked flag, expiry — enables rotation and per-session revocation
- **Product** — name, description, `driveFolderId` (unique — one Drive folder per product)
- **File** — cached copy of a Drive file's metadata, plus our own fields: `title`, `description`, `remarks`, `visibility`, `categoryId`, `deletedAt` (soft delete)
- **Category** — simple name, one-to-many with File
- **Tag** / **FileTag** — many-to-many between File and Tag via an explicit join table
- **SyncHistory** — audit trail of each Drive sync attempt (files found/created/updated, status, errors)

Full field-level definitions live in `backend/prisma/schema.prisma`.

---

## Key design decisions

**Metadata sync, not live Drive queries.** `/products/:id/files` reads from our own `File` table, populated by an explicit `/products/:id/sync` action — not a live Drive API call on every page view. This keeps search fast, avoids Drive API rate limits, and lets categories/tags/titles persist independently of Drive's own filenames.

**Recursive folder flattening.** Drive folder hierarchy is intentionally discarded — `DriveService.listFilesInFolder` recurses into subfolders and returns one flat list of real files, matching the business requirement that employees browse by product/search, not by folder structure.

**Soft delete for files.** A nullable `deletedAt` timestamp, not a separate table — active-record queries filter it centrally in `FilesService`. Products currently use hard delete (no recycle bin at the product level yet).

**JWT with rotating refresh tokens.** Access tokens (15 min) and refresh tokens (7 days) use separate signing secrets. Refresh tokens are hashed with SHA-256 (not bcrypt — bcrypt's 72-byte input limit causes hash collisions on long tokens sharing a prefix) and stored so a specific session can be revoked without invalidating others. Each refresh call revokes the used token and issues a new one.

**Role-based registration.** `POST /auth/register` requires an authenticated `ADMIN` (`RolesGuard` + `@Roles('ADMIN')`) — the system is not open for public signup.

**Driver-adapter Prisma setup.** Using Prisma 7, which requires an explicit database driver adapter (`@prisma/adapter-pg`) rather than an implicit connection — configured in `PrismaService`, connection string read via `@nestjs/config`.

### Google Drive integration

1. A Google Cloud service account is created and granted the Drive API scope `drive.readonly`.
2. Each Drive folder intended for use as a Product must be explicitly shared with the service account's email (same as sharing with a person) — a service account has no default access to any Drive.
3. The backend authenticates using the service account's JSON key (mounted via Docker volume at runtime, never baked into the image or committed to source control).

---

## Known limitations

| Issue | Cause | Fix scope |
|---|---|---|
| Refresh tokens stored in `localStorage` | Demo-simplicity tradeoff | Move to httpOnly cookies for production hardening |


---

## Deployment

Three-service Docker Compose setup: `postgres`, `backend`, `frontend`. See root `docker/docker-compose.yml`.

Notes specific to this stack:
- Backend uses a multi-stage Dockerfile; Prisma 7's generator emits TypeScript source (not precompiled JS), which required setting `rootDir: "./"` in `tsconfig.json` so the build output structure stays consistent (`dist/src/main.js`).
- Frontend uses Next.js `output: 'standalone'` for a minimal production image. `NEXT_PUBLIC_API_URL` is baked in at **build time** (via Docker `ARG`/`ENV`), not read at container runtime — rebuilding the image is required if this needs to change per environment.
- pnpm's build-script approval (`onlyBuiltDependencies`) must be committed in `package.json`/`pnpm-workspace.yaml` — Docker builds are non-interactive and cannot answer pnpm's approval prompt.