# Manual E2E UI Test Plan (Pass/Fail)

## Scope
Validate the full UI flow end to end using the in-app browser:
- Registration, login, logout
- Profile updates (full name and password)
- Task creation, completion, filtering, sorting, pagination
- Deletion and final pagination assertions

## Test Run Metadata
- Tester:
- Date:
- Environment:
- Frontend URL:
- Backend URL:
- Build/Commit:

## Global Pass Criteria
- All steps marked PASS.
- No blocking UI errors.
- Data/state remains consistent after navigation and refresh.

## Defect Logging Format
- ID:
- Step ID:
- Severity (Blocker/High/Medium/Low):
- Expected:
- Actual:
- Repro notes:
- Screenshot/reference:

## Test Data
- Test user email:
- Initial password:
- Updated password:
- Updated full name:
- Naming convention for tasks: Task 001 to Task 100

## Detailed Checklist

| Step ID | Action | Expected Result | PASS/FAIL | Evidence/Notes |
|---|---|---|---|---|
| A01 | Open app landing page | Login screen renders without console/app error UI |  |  |
| A02 | Click Register and open registration route | Registration screen loads correctly |  |  |
| A03 | Register a new user with valid data | Registration succeeds and dashboard loads authenticated state |  |  |
| A04 | Verify header/profile menu appears | Header shows profile controls and authenticated UI |  |  |
| A05 | Create Task 001 | Task 001 appears in open task list |  |  |
| A06 | Logout | User is redirected to login |  |  |
| A07 | Login with same user | Dashboard loads and Task 001 is visible |  |  |
| A08 | Navigate to Profile | Profile page loads with current user data |  |  |
| A09 | Update full name | Save succeeds and new full name is visible in header/profile |  |  |
| A10 | Update password (with current password provided) | Save succeeds with no validation or API error |  |  |
| A11 | Logout | User is redirected to login |  |  |
| A12 | Login using updated password | Authentication succeeds using new password |  |  |
| A13 | Create tasks Task 002 through Task 100 | 100 total tasks now exist for this user |  |  |
| A14 | Open pagination controls | Pagination controls are visible and enabled appropriately |  |  |
| A15 | Set page size to 25 | Page size updates and total pages match item count |  |  |
| A16 | Navigate with Next Page repeatedly | Page increments correctly; no skipped or duplicated pages |  |  |
| A17 | Use Last Page | Last page loads with correct remaining item count |  |  |
| A18 | Set page size to 50 | Page size updates and total pages recompute correctly |  |  |
| A19 | Set page size to 100 | Single-page behavior is correct when applicable |  |  |
| A20 | Toggle Overdue Only filter on and off | Overdue-only view and default view both return expected task subsets |  |  |
| A21 | Apply sort Recently Added ascending | Items are ordered by created timestamp ascending |  |  |
| A22 | Apply sort Recently Added descending | Items are ordered by created timestamp descending |  |  |
| A23 | Apply sort Alphabetical ascending | Items ordered by description A to Z |  |  |
| A24 | Apply sort Alphabetical descending | Items ordered by description Z to A |  |  |
| A25 | Apply sort Due Date ascending | Items ordered by nearest due date first (null handling consistent) |  |  |
| A26 | Apply sort Due Date descending | Items ordered by latest due date first (null handling consistent) |  |  |
| A27 | Mark 50 tasks complete | Exactly 50 tasks move to completed state |  |  |
| A28 | Re-run pagination with current data split | Pagination remains accurate after status changes |  |  |
| A29 | Re-run Overdue Only filter after 50 complete | Counts and subsets are correct |  |  |
| A30 | Re-run all sorts after 50 complete | Ordering remains correct in each state/filter |  |  |
| A31 | Mark remaining tasks complete | All tasks now in completed state |  |  |
| A32 | Re-run Overdue Only filter after all complete | Expected subset is shown based on due dates and completion |  |  |
| A33 | Re-run all sorts after all complete | Sorting remains deterministic and correct |  |  |
| A34 | Delete 50 distinct tasks (confirm modal each time) | Modal copy is "Are you sure you want to delete this task?" and each delete persists after refresh |  |  |
| A34a | Open delete modal and click outside | Modal closes without deleting the task |  |  |
| A35 | Refresh app while authenticated | Remaining tasks persist and deleted tasks do not return |  |  |
| A36 | Set page size to 25 after deletions | Exactly 2 pages are shown |  |  |
| A37 | Set page size to 50 after deletions | Exactly 1 page is shown |  |  |
| A38 | Verify toaster/modal behavior during actions | Toasts/modals show and dismiss correctly; no stuck overlays |  |  |
| A39 | Verify no unexpected API/auth failure UX | No unhandled auth redirects or silent failures |  |  |
| A40 | Final consistency check | Task totals and statuses match all prior actions |  |  |

## Final Result
- Overall Status: PASS / FAIL
- Blocking defects:
- Non-blocking defects:
- Summary:
