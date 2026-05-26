# Testing Conventions

## Purpose

Use this skill to enforce consistent testing practices across the ToDoManagement codebase.

## Scope

- Frontend tests (Vitest + Testing Library)
- Backend tests (.NET test projects)
- Manual QA pass/fail execution and reporting

## Core Rules

1. Keep tests deterministic; avoid time-sensitive assertions unless time is controlled.
2. Prefer behavior-focused tests over implementation details.
3. Add or update tests whenever user-visible behavior changes.
4. Keep Arrange/Act/Assert structure clear in each test.
5. Use realistic, readable test data and avoid magic values.

## Frontend Conventions

- Run tests with: `npm --prefix c:\\Repos\\ToDoManagement\\frontend run test -- --run`
- Use `screen.getByRole` and accessible queries first.
- Mock network/API boundaries rather than internal component details.
- Cover important UI states: loading, success, validation error, API error.
- Validate user interactions and visible outcomes over implementation details.
- Prefer shared test helpers for repeated setup (for example auth session setup).
- Keep test names explicit about behavior and expected outcome.

## Backend Conventions

- Run tests with: `dotnet test --property:WarningLevel=0 --logger "console;verbosity=minimal"`
- Validate status code + response body + side effects.
- Include negative-path tests for validation/auth/authorization.
- Keep test fixtures isolated to prevent cross-test pollution.
- Keep tests deterministic and focused on behavior, not implementation details.
- Use clear Arrange/Act/Assert structure and `FluentAssertions` assertions.
- Use `FluentAssertions.Execution.AssertionScope` when a test verifies multiple related outcomes so failures are reported together.
- Prefer targeted test filters during development; run the full backend test project before completion.
- Keep tests under `backend/tests/ToDoManagement.Api.Tests/` organized by `Controllers`, `Services`, and `Validators`.

## Manual QA Conventions

- Source checklist: `frontend/src/tests/manual-e2e-ui-pass-fail-plan.md`
- Store execution artifacts in: `results/`
- Record per-step PASS/FAIL with concise evidence notes.
- Log defects with expected vs actual and reproducible steps.

## Definition Of Done For Test Changes

- Relevant automated tests added or updated.
- Manual test plan updated when UI workflow changes.
- Test run executed and outcome captured in the PR or work notes.
