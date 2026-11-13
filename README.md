# ComicVerse — local development starter

ComicVerse is a dark, reader-first discovery and personal-library platform. This package contains the homepage foundation plus the first database/authentication milestone.

## Current milestone

Included:
- Next.js 15 + React 19 + TypeScript + Tailwind CSS foundation.
- ComicVerse dark visual identity and homepage.
- Existing Express API health indicator and live MangaDex search UI. Signed-in users can save search results directly to their library.
- Better Auth email/password registration and sign-in routes.
- Neon PostgreSQL + Drizzle ORM connection.
- Database schema for accounts, sessions, linked accounts, verification, library entries, reading progress, approved content sources, series, chapters, genres and user reports.
- A database health endpoint at `/api/health/db`.
- A signed-in library shell at `/library`.

Not yet included: email delivery/verification, production admin UI, persisted reading progress, uploads/object storage, and an authorized automated Asura content integration. Live search uses the public MangaDex API. Provider access depends on the provider's availability and network access from the API host.

## Requirements

- Node.js 22 LTS recommended.
- npm.
- A Neon PostgreSQL project (or another PostgreSQL connection compatible with the Neon serverless driver).

## 1. Install dependencies

From this folder:

```powershell
npm install
```

## 2. Configure environment variables

Copy the example:

```powershell
Copy-Item .env.local.example .env.local
```

Open `.env.local` and set:

- `DATABASE_URL`: the PostgreSQL connection string from your Neon dashboard. Keep it private.
- `BETTER_AUTH_SECRET`: a unique random secret of at least 32 characters.
- `BETTER_AUTH_URL`: `http://localhost:3000` for local development.
- `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` for local development.
- `NEXT_PUBLIC_API_BASE_URL`: `http://localhost:3001` for the existing Express API.

Generate a secure secret in PowerShell with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the output as `BETTER_AUTH_SECRET`. Never commit `.env.local` or share its contents.

## 3. Create and apply the database migration

The Drizzle schema is in `src/db/schema.ts`. Generate a migration file, inspect it, then apply it:

```powershell
npm run db:generate
npm run db:migrate
```

For local experimentation only, `npm run db:push` can push the schema directly without creating a migration. Prefer the migration workflow above so schema changes are tracked.

## 4. Run ComicVerse

Start the existing Express API in its own terminal (if you are using its search endpoint):

```powershell
cd ..\manga-novel-api
npm run dev
```

In another terminal, from this frontend folder:

```powershell
npm run dev
```

Open `http://localhost:3000`.

## 5. Verify the setup

- Homepage: `http://localhost:3000`
- Registration: `http://localhost:3000/register`
- Sign in: `http://localhost:3000/login`
- Personal library: `http://localhost:3000/library`
- Database check: `http://localhost:3000/api/health/db`
- Better Auth status: `http://localhost:3000/api/auth/ok`

Create an account, sign out, then sign back in. A successful database health response looks like:

```json
{ "status": "ok", "database": "connected" }
```

## 6. Grant the first administrator role

New registrations always receive the `user` role. The role field is not accepted from the registration form (`input: false`). After you have registered your own account, promote it manually from the Neon SQL Editor, replacing the email with your account email:

```sql
UPDATE "user"
SET role = 'admin'
WHERE email = 'your-account@example.com';
```

Do not add a public endpoint that lets users change their own role. Admin-only API handlers and UI will be added in a later milestone and must verify the session and role on the server for every operation.

## Security and production notes

- This milestone keeps email verification disabled so local registration works without an email provider. Before public launch, configure a transactional email provider and enable Better Auth email verification.
- Use HTTPS and production-only secrets in deployment. Never reuse the local auth secret in production.
- Configure rate limits, backups, logging, error monitoring and an account recovery flow before public launch.
- Restrict CORS and approved content-source access at the backend. Never treat a client-side hidden button as authorization.
- Store only metadata and links that the relevant content source permits. Do not scrape around bot checks, copy restricted chapters, or rehost third-party images without permission.
- Uploaded files will require durable object storage and validation; no upload endpoint is exposed in this milestone.

## Useful commands

```powershell
npm run dev
npm run type-check
npm run build
npm run db:generate
npm run db:migrate
```

If a command fails, copy the complete terminal output (remove secrets first) and share it for debugging.
