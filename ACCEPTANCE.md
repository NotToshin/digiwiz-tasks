# Release acceptance

## Phase 2 verification

- [x] Frontend and API TypeScript checks pass and the frontend production build succeeds.
- [ ] Migrations and fictional seeds run twice without duplicate records.
- [ ] Two-assignee tasks persist across reloads and count once in company totals.
- [ ] Task updates, assignment changes and history commit together, and stale versions return 409.
- [ ] Calendar, company pages and Board show the same saved task after editing.
- [ ] Run npm run db:check against the local seeded database. Database execution remains pending due to this session's socket restrictions.

## Release checks

- [ ] Workspace typography uses Poppins and the rail header shows only the home mark, with an accessible name.

- [ ] An invited person can register using their chosen email, verify a single-use OTP, set a password, log in and complete profile onboarding. An uninvited account cannot register. Deactivation revokes access.
- [ ] Office Wi-Fi works. Ordinary mobile data and home connections fail. Direct URLs, API requests and downloads enforce the same boundary. Forged forwarding headers cannot override the office rule.
- [ ] Staff can access only permitted client companies, projects, jobs, files, notifications and activity. A role change is reflected on subsequent access. Superadmin and Lead behavior is verified using separate test accounts.
- [ ] A staff member can create a permitted task under the correct company project, add a work type, several assignees, details, notes, deadlines and checklist. Reassignment and deadline edits are logged.
- [ ] A review-required task needs lead approval. Returning work records feedback. Done cannot be reopened, and the linked follow-up gets a new ID. Waiting for Client stays visible.
- [ ] Dependency cycles are prevented. Weekly/monthly recurring jobs generate once per occurrence across retries. Attachments are limited and private. Each notification links to a currently accessible item without duplicates on retries.
- [ ] The dashboard shows a live work counter and correct due-today and progress summaries. The calendar shows both attendance and deadlines with usable filters. The boards and timeline use the same dates and statuses.
- [ ] Multiple tabs, retries and repeat logins produce one open attendance interval. Logout ends it. A lost connection closes at the prescribed cutoff and produces a reviewable record. Two shifts total correctly without double counting.
- [ ] Month-end totals handle Dhaka date boundaries. Scheduled days without a login show Leave after the day ends. Holidays, off days and future dates are handled separately. Attendance corrections record reasons and preserve originals.
- [ ] Task timers close on logout or automatic session close and do not inflate working-hour totals. Staff see only attendance data and corrections that they are allowed to see.
- [ ] Desktop layouts work at 1440×1024 and 1280×720. Record initial bundle size and check that Calendar and task details remain responsive with representative sample jobs. Establish a pilot performance baseline.
- [ ] Staging migration, OTP delivery, job scheduling, database backup restore and file restore are verified using the intended Hostinger setup. Pilot users finish one real assignment-to-approval cycle and compare reported hours with worked hours.


## Phase 3 status

- [x] TypeScript checks and eight focused account, scope and time tests pass.
- [ ] Database-backed concurrent session checks pass.
- [ ] OTP registration, reset, onboarding and revocation pass in the browser.
- [ ] Attendance corrections and task timer cutoff pass against MySQL.
- [ ] Granular role configuration and optional profile fields are completed.

## Phase 5 preparation

- [ ] Confirm the existing Hostinger plan, target, deployment source and office proxy path.
- [ ] Verify timeline month navigation and clipped multi-month tasks at both desktop sizes.
- [ ] Execute the private staging runbook in PHASE_5_STAGING.md, including actual Wi-Fi/mobile testing, email delivery, scheduled jobs and isolated backup restore.
- [ ] Resolve Phase 2–4 outstanding acceptance checks before pilot onboarding.
