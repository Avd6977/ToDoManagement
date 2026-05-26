# Manual E2E UI Run Results (2026-05-26)

## Run Context
- Plan file: frontend/src/tests/manual-e2e-ui-pass-fail-plan.md
- In-app browser URL used: http://localhost:5173
- Test user: e2e.user.202605262030@todo.local

## Environment Issues Observed
1. Backend start command from backend folder returned bind failure on port 5000 (already in use).
2. Frontend start from repo root failed (no package.json at root).
3. Frontend start from frontend folder succeeded, but port 5173 was already in use and Vite started on 5174.

## Executed Flow Summary
1. Register user: PASS
2. Create Task 001: PASS
3. Logout/Login same user: PASS
4. Update profile full name + password: PASS
5. Logout/Login with new password: PASS
6. Bulk create Task 002-Task 100: PASS (UI automation completed)
7. Sort options (Recently Added, Alphabetical, Due Date): PASS
8. Sort direction toggle (Ascending/Descending): PASS
9. Overdue Only filter with no due dates: PASS (returns zero open tasks)
10. Completion/deletion stress phase: PARTIAL (automation interrupted by UI interaction blockers)

## Key Defects / Gaps Against Requested Prompt

### DEF-001 (High)
- Area: Pagination controls
- Expected: Next Page and Last Page controls available.
- Actual: Next/Previous present; Last Page control not present.
- Impact: Cannot complete prompt step requiring Last Page validation.

### DEF-002 (High)
- Area: Page size controls
- Expected: Ability to set page size to 25 and 50 and validate page counts.
- Actual: No page size control found in task UI.
- Impact: Cannot execute required steps: set page size to 25 => 2 pages, set page size to 50 => 1 page.

### DEF-003 (Medium)
- Area: Sort/Filter popover interaction
- Expected: Task row actions clickable after selecting sort/filter values.
- Actual: In one reproducible path, popover remained over list and intercepted clicks on Mark Complete.
- Impact: Interrupted automated completion run and required state reset/retry.

### DEF-004 (Medium)
- Area: Prompt coverage mismatch
- Expected: Prompt requested testing each filtering option.
- Actual: UI exposes Overdue Only filter in popover, but not explicit Open/Completed/All filter selectors in the same area.
- Impact: Full requested filter-matrix cannot be executed exactly as written via current UI controls.

## Observed Runtime State At End Of Run
- Open tasks with Mark Complete visible on current page: 25
- Completed tasks with Mark Incomplete visible on current page: 25
- Last Page control count: 0
- Page-size control count: 0

## Overall Result
- Status: FAIL (blocked by missing required controls and interaction issues)
- Primary blockers: DEF-001, DEF-002
