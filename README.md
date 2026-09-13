# BIG BROTHER — Staff Relation

Staff-facing payment, salary, leave and special-request module for the BIG BROTHER Accounting System.

## Public module

`https://angsokhey11-cloud.github.io/big-brother-staff-relation/`

The module shares the BIG BROTHER Supabase Auth session stored by the Dashboard under `BB_SUPABASE_DEV_SESSION_V1`.

## Frontend structure

- `index.html` — page structure only
- `staff-relation.css` — responsive Staff Relation UI
- `staff-relation.js` — Supabase session, rendering and request workflows
- `.nojekyll` — static GitHub Pages deployment marker

## Staff pages

1. **Your Payment** — available earnings, monthly salary, pending payment requests
2. **Payment History** — paid staff payments and salary advances with Expense references
3. **Leave Request** — staff leave submission
4. **Leave History** — request status, Admin decision and note
5. **Special Request** — Salary Advance request and history

## Earning types

- Sales Incentive
- Driver 1 Allowance
- Driver 2 Allowance
- Monthly Salary
- Special Allowance

A staff identity can contain a Primary Staff ID plus linked operational Staff IDs. Role-based earnings from linked identities are rolled into the primary Staff Relation account.

## Admin View

Admin accounts have two modes inside this repo:

- **My Account** — the Admin's own staff account, with normal staff actions when the Admin login is linked to a Primary Staff ID.
- **Admin View** — read-only access to all active staff relation profiles.

Admin View can review available earnings, salary and salary advances, pending payment requests, Payment History, Leave History and Special Request History. It does **not** impersonate staff or submit requests on their behalf.

Backend RPCs:

- `bb_staff_relation_admin_staff_list()`
- `bb_staff_relation_admin_view(...)`

Both are protected by BIG BROTHER Admin authorization in Supabase.

## Verified end-to-end flows

- Sales Incentive → Staff Payment Request → Admin Approval → Staff Expense → Payment History
- Salary Advance → Admin Approval → Staff Expense → Remaining Salary deduction
- Driver Allowance → closed Stock Batch → available earning
- Special Allowance → monthly base − approved leave deduction
- Multi-earning Payment Request → Admin review → total verification
- Leave Request → Admin Approval → Leave History

## Business rules currently verified

- Sales Incentive is effective-dated and Batch Sales only; Direct Sales are excluded.
- Driver Allowance is effective-dated by location and Driver 1 / Driver 2 role.
- Driver Allowance is earned after the Stock Batch is closed.
- Salary is effective-dated.
- Salary Advance reduces only the approved amount from remaining salary.
- Special Allowance is calculated after month-end and can be reduced by approved leave days.
- Requested/Paid earnings are preserved and should not be rewritten by later rate changes.
