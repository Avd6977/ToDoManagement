# ToDoManagement

Full-stack task management application with:
- Backend: .NET 8 Web API, EF Core + SQLite, JWT authentication
- Frontend: React + TypeScript + Vite + Axios

## Required Versions

- .NET SDK: **8.0** (or newer 8.0.x patch)
  - Download: <https://dotnet.microsoft.com/download/dotnet/8.0>
  - Verify:
    ```bash
    dotnet --version
    ```

- Node.js: **LTS**
  - Install the current LTS release (includes npm): <https://nodejs.org/en/download>
  - Verify:
    ```bash
    node --version
    ```

- npm: **9+**
  - npm is included with Node.js LTS.
  - Update globally if needed:
    ```bash
    npm install -g npm@^9
    npm --version
    ```

- EF CLI: **dotnet-ef 8.0.20**
  - Install/update:
    ```bash
    dotnet tool install --global dotnet-ef --version 8.0.20
    dotnet tool update --global dotnet-ef --version 8.0.20
    dotnet ef --version
    ```

## Quick Start (Run The Project)

These steps start both API and UI locally.

1. Open a terminal at the repo root:

```bash
cd ToDoManagement
```

2. Start the backend API in terminal #1:

```bash
cd backend
dotnet restore
dotnet build
dotnet run
```

3. Open a second terminal at the repo root:

```bash
cd ToDoManagement
```

4. Start the frontend in terminal #2:

```bash
cd frontend
npm install
npm start
```

5. Open the app in your browser:
- Frontend: `http://localhost:5173`
- Backend API (if needed directly): `http://localhost:5000`
- Swagger (Development only): `http://localhost:5000/swagger`

Notes:
- The backend applies pending EF Core migrations automatically on startup.
- SQLite database file is created/updated at `backend/tasks.db`.
- Keep both terminal windows running while using the app.

## Run Tests

Backend (from `backend/`):

```bash
dotnet test .\tests\ToDoManagement.Api.Tests\ToDoManagement.Api.Tests.csproj --property:WarningLevel=0 --logger "console;verbosity=minimal"
```

Frontend (from `frontend/`):

```bash
npm run test
```

## Seed Task Data For Manual Testing

To quickly create large task sets for pagination/filter/sort testing, run the frontend seeding script.

From `frontend/`:

```bash
node ./scripts/seed-tasks.mjs --email tester@example.com --password Strong1! --register true --count 100 --startAt 1 --taskPrefix "Task"
```

Options:
- `--email` (required): user email used to login.
- `--password` (required): password for that user.
- `--count` (optional): number of tasks to create (default: `100`).
- `--startAt` (optional): first task number (default: `1`).
- `--taskPrefix` (optional): description prefix (default: `Task`).
- `--prefix` (optional, legacy): alias for `--taskPrefix`.
- `--apiBaseUrl` (optional): API base URL (default: `http://localhost:5000/api`).
- `--register true` (optional): register the user first if login fails.
- `--fullName` (optional): full name used when `--register true` is specified (default: `Task Seeder`).

Example with auto-register:

```bash
node ./scripts/seed-tasks.mjs --email qa.seed@example.com --password Strong1! --register true --fullName "QA Seeder" --count 50 --taskPrefix "Task"
```

## Features

- User registration and login with JWT access token + refresh token issuance.
- Authentication token state is managed with secure HttpOnly cookies (access + refresh).
- Refresh token rotation (`POST /api/auth/refresh`) and explicit revocation (`POST /api/auth/revoke`).
- Password policy enforcement on register:
  - Minimum 8 characters
  - At least 1 letter
  - At least 1 number
  - At least 1 special character
- Passwords are stored at rest as salted PBKDF2 (SHA-256) hashes, never plaintext.
- Authenticated task CRUD scoped to the logged-in user.
- Task filtering via `GET /api/tasks` query parameters:
  - `search` (matches description)
  - `status` (`open`, `completed`, `overdue`, or `all`)
- Task sorting via `GET /api/tasks` query parameter:
  - `sort` (`alphabetical`, `dueDate`, or `recentlyAdded`; default: `recentlyAdded`)
  - `sortDirection` (`asc` or `desc`; default: `asc`)
- Task pagination via `GET /api/tasks` query parameters:
  - `page` (default: `1`)
  - `pageSize` (`25`, `50`, or `100`; default: `25`)
- Dashboard split view for open tasks + expandable completed tasks section with lazy loading.
- Overdue due-date highlighting in the dashboard.
- Profile management for authenticated users:
  - Update full name
  - Optional password change when current password is provided
  - Email is immutable
- Task audit metadata:
  - `CreatedDateUtc`
  - `UpdatedDateUtc`
- Application-managed temporal history (`TaskItemHistory`) for update/delete snapshots.
- Strongly typed JWT settings via `JwtTokenDto` (`IOptions<JwtTokenDto>`).
- Migration-based schema updates on startup (uses `Database.Migrate()`).
- Validation using FluentValidation for auth and task payloads.

## EF Migrations

This project uses EF Core migrations for schema changes over time (including SQLite).

### Required Packages and Tools

From `backend/ToDoManagement.Api.csproj`:

- `Microsoft.EntityFrameworkCore.Sqlite` **8.0.20**
- `Microsoft.EntityFrameworkCore.Design` **8.0.20**

CLI tool required to scaffold/apply migrations:

```bash
dotnet tool install --global dotnet-ef --version 8.0.20
dotnet tool update --global dotnet-ef --version 8.0.20
dotnet ef --version
```

If your machine cannot use global tools, install a local tool manifest and local `dotnet-ef` tool.

### Generate a Migration

Run from `backend/`:

```bash
dotnet ef migrations add <MigrationName>
```

Example for the `FullName` column update:

```bash
dotnet ef migrations add AddUserFullNameColumn
```

### Apply Migrations to the Database

Run from `backend/`:

```bash
dotnet ef database update
```

### Useful Migration Commands

List migrations:

```bash
dotnet ef migrations list
```

Rollback to a previous migration (or `0` for empty schema):

```bash
dotnet ef database update <MigrationNameOr0>
```

Remove the last migration (before it is applied to shared environments):

```bash
dotnet ef migrations remove
```

### Notes for This Repository

- `User.FullName` is configured as `VARCHAR(100)` to align with the UI's 100-character limit.
- The migration files are located under `backend/Migrations/`.
- For existing local databases created before this column existed, run `dotnet ef database update` to add the missing column.

## Database Initialization

- Database provider: SQLite (`backend/tasks.db`)
- Initialization strategy: EF Core migrations (`Migrate()` at startup)
- Result: pending migrations are applied automatically when the API starts

## Frontend Notes

- API base URL configuration:
  - Default: `http://localhost:5000/api`
  - Override with environment variable `VITE_API_BASE_URL`.

- Auth is route-based:
  - `/` login screen (default)
  - `/register` registration screen
  - `/tasks` authenticated dashboard
  - `/create-task` authenticated create-task page
  - `/profile` authenticated profile page
- Login view includes inline `Register` link.
- Auth token state is server-managed with secure HttpOnly cookies.
- Header includes a profile dropdown with full name + logout actions.
- Forms use touched-field validation:
  - Field-level validation messages are shown only after the field has been touched (blurred).
  - Save/submit buttons are disabled until form inputs are valid.
- Task due date UX:
  - Create and edit date pickers use a min date of today to prevent selecting past dates.
  - Edit flow allows updates when an existing past due date is unchanged, but blocks changes to a new past date.
- Task list includes a sort icon dropdown with controls for:
  - Sort options: `Recently Added`, `Alphabetical`, and `Due Date`
  - Sort direction: `Ascending` and `Descending`
  - Filter option: `Overdue Only`
- Global auth guard:
  - API `401 Unauthorized` responses clear local auth state and return the user to the login route.

## Assumptions

- SQLite is used for local persistence (`tasks.db`).
- SQLite does not provide SQL Server temporal tables, so temporal behavior is application-managed via `TaskItemHistory`.

## Limitations

- Single environment-focused configuration.

## Future Improvements

- Add a production-ready Forgot Password flow backed by a production-grade email provider (for example SendGrid/SES)
- Add roper secret management 
  - Required enhancement: move `Jwt:Key` to a secure secret store (for example Azure Key Vault) or environment-based secret configuration, and remove committed secrets from source control.
- Add rate limiting and abuse protections around auth endpoints.
- Add role-based authorization and stricter revoke authorization semantics.
- Add the ability to create different lists and manage those lists
- Add the ability to invite others to join your list in different capacities i.e. Reader, Editor, Creator
- Add the ability to assign others in your list to tasks
