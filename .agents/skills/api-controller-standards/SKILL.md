---
name: api-controller-standards
description: 'Implement or update ASP.NET Core API controllers, validators, DI registrations, and request/response contracts for this repository. Use when adding endpoints, modifying controller actions, wiring FluentValidation, or updating API-layer error handling.'
argument-hint: 'Endpoint or controller task to implement'
---

# API Controller Standards

Implement API-layer changes that match this repository's established patterns.

## When to Use

- Add or update endpoints in `backend/Controllers/`.
- Add or update validators in `backend/Validators/`.
- Add or update request/response DTOs in `backend/Dtos/`.
- Wire API-level DI registrations in `backend/Registrations/`.
- Keep controller/service error mapping behavior consistent with existing controllers.

## Procedure

1. Define or update request and response DTOs in `backend/Dtos/`.
2. Implement or update controller actions using this shape:

- Route at controller level: `[ApiController, Route("api/...")]`.
- Action-level route attributes such as `[HttpGet]`, `[HttpPost]`, `[HttpPut("{id:guid}")]`, `[HttpDelete("{id:guid}")]`.
- Delegate business logic to injected service interfaces in `backend/Services/Interfaces/`.
- Keep cancellation-token passthrough on async actions.

3. Register validators in `backend/Registrations/RegisterValidators.cs`.
4. Register settings in `backend/Registrations/RegisterSettings.cs`.
5. Register services/auth/cors and framework services in `backend/Registrations/RegisterServices.cs`.

## Required Conventions

- Keep controllers thin: validate input, resolve authenticated user context, and delegate to services.
- Use constructor injection for service dependencies.
- Use async methods with `CancellationToken` passthrough.
- Preserve route naming style used in this repo (`api/auth/...`, `api/tasks/...`).
- Return `ActionResult<T>` and map service result status codes to the correct HTTP response type.

## Verification

- Run `dotnet build` from `backend/`.
- Run impacted tests:
    - `dotnet test .\tests\ToDoManagement.Api.Tests\ToDoManagement.Api.Tests.csproj --property:WarningLevel=0 --logger "console;verbosity=minimal"`
    - or targeted `--filter` expressions for changed controllers/services.
