# ToDoManagement

Full-stack task management application with:
- Backend: .NET 7 Web API, EF Core + SQLite, JWT authentication
- Frontend: React + TypeScript + Axios

## Features

- User registration and login with JWT issuance
- Authenticated task CRUD
- Tasks are scoped to authenticated user:
	- `GET /api/tasks` returns tasks owned by or assigned to current user
	- `POST /api/tasks` creates task owned by current user, default assigned to current user
	- `PUT /api/tasks/{id}` updates task, owner-only
	- `DELETE /api/tasks/{id}` deletes task, owner-only
- Input validation for auth and task payloads
- Meaningful API error messages for common failure cases
- Frontend stores JWT and automatically sends `Authorization: Bearer <token>`
- Immediate UI updates after create/update/delete

## Project Structure

```text
ToDoManagement/
├── backend/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   └── TasksController.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Dtos/
│   │   ├── AuthDtos.cs
│   │   └── TaskDtos.cs
│   ├── Models/
│   │   ├── TaskItem.cs
│   │   └── User.cs
│   ├── Services/
│   │   ├── DateTimeService.cs
│   │   ├── IDateTimeService.cs
│   │   ├── IJwtTokenService.cs
│   │   ├── IPasswordHasherService.cs
│   │   ├── JwtTokenService.cs
│   │   └── PasswordHasherService.cs
│   ├── Validators/
│   │   ├── AuthValidators.cs
│   │   └── TaskValidators.cs
│   ├── Program.cs
│   ├── ToDoManagement.Api.csproj
│   └── appsettings.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── TaskItem.tsx
│   │   │   └── TaskList.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   ├── Task.ts
│   │   │   └── User.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Backend Setup

1. Open terminal in `backend/`
2. Restore and build:

```bash
dotnet restore
dotnet build
```

3. Run API:

```bash
dotnet run
```

4. API base URL (default):
- `http://localhost:5000` (or URL shown by `dotnet run` output)

Swagger is enabled in Development.

## Frontend Setup

1. Open terminal in `frontend/`
2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

4. Open Vite URL shown in terminal (default `http://localhost:5173`)

## Authentication Endpoints

- `POST /api/auth/register`
	- Body: `{ "username": "string", "password": "string" }`
	- Returns: `{ id, username, token }`
- `POST /api/auth/login`
	- Body: `{ "username": "string", "password": "string" }`
	- Returns: `{ id, username, token }`

## Task Endpoints

All endpoints require Bearer token.

- `GET /api/tasks`
	- Returns tasks where current user is owner or assignee
- `POST /api/tasks`
	- Body: `{ title, description, dueDate?, assignedToId? }`
	- `assignedToId` defaults to current user when omitted
- `PUT /api/tasks/{id}`
	- Owner-only
	- Body: `{ title, description, dueDate?, isCompleted, assignedToId? }`
- `DELETE /api/tasks/{id}`
	- Owner-only

## Assumptions

- UI uses `assignedToId` (GUID) directly for assignment input to keep backend surface minimal and avoid extra directory endpoints.
- Task completion toggle is owner-only because update is owner-only by requirement.
- SQLite is used for persistence (`tasks.db`) for a simple local full-stack setup.

## Limitations

- No refresh-token flow; JWT is stored in `localStorage`.
- No user lookup endpoint for username-to-ID resolution in assignment UI.
- No pagination/filtering for task lists.
- Single environment-focused configuration.

## Future Improvements

- Add refresh tokens and token revocation.
- Add user search endpoint and assign-by-username UX.
- Add role-based authorization and audit fields.
- Add automated tests (unit/integration and component tests).
- Add Docker and CI pipeline configuration.
