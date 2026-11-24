# Phase 3 implementation and verification

The local implementation includes invitation-based registration, six-digit OTPs, password reset, scrypt password hashes, database sessions, onboarding, CSRF validation, office CIDR checks, project-scoped reads and writes, attendance, separate task timers and append-only corrections.

## Local setup

Keep your existing database values in .env. Configure APP_ORIGIN=http://127.0.0.1:63477 and OFFICE_ALLOWED_CIDRS=127.0.0.1/32,::1/128 for this local test. Leave TRUSTED_PROXY_CIDRS empty for a direct connection. These are explicit local network settings. Configure real office egress and verified proxy ranges before staging.

Run:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run accounts:bootstrap
npm.cmd run api
```

In a second terminal run npm.cmd run dev. Open http://127.0.0.1:63477. Choose Accept invitation and enter admin@example.test. Request a code, open the newest .eml file under .local/mail, and use its code with a password of at least 12 characters. Sign in and complete your name fields.

The test inbox writes email files locally and sends no external mail. Production startup remains disabled pending deployment readiness and a real email transport.

Open Staff access to invite a fictional seeded staff member. Use a separate browser profile for the second account. Lead access to agency attendance is a separate flag. Deactivation revokes sessions and the last active Superadmin is protected.

## Attendance walkthrough

1. Sign in twice, including in separate tabs. Check one open interval with npm run test:phase3:db.
2. Open Attendance and start an assigned In Progress task. A second task timer must be rejected until the first is stopped.
3. Log out. Attendance and task time close together. All sessions for that staff account are revoked.
4. Sign in again, close all app tabs for ten minutes, and run npm run attendance:reconcile. The session should close at the last confirmed contact and show Needs Review.
5. Use the correction form with an authorized account. Enter timestamps with explicit timezone offsets and a reason. Original intervals and correction records are preserved.
6. Inspect Calendar and the dashboard for your own attendance. Attendance supports a staff filter and monthly totals. Staff requests for another person's attendance are rejected by the API.

The scheduled reconciliation command must run every minute in the eventual hosting environment. Attendance reads also reconcile stale intervals. Refreshing a page preserves the existing attendance interval.

## Proposed local policies

The fictional schedule uses Saturday through Thursday, with Friday off, a 12-hour maximum shift, and no lunch deduction. Superadmin can change weekdays and holidays through PUT /api/admin/schedule. Confirm these policies before using real staff. Closed past workdays without attendance show Leave. Future workdays remain unclassified. Holidays and off days are shown separately.

## Practice component

Edit src/features/attendance/ElapsedTime.tsx. It receives integer seconds and renders HH:MM:SS. Implement your own formatElapsed function while keeping its exported signature.

Success criteria:

- 0 renders 00:00:00.
- 3661 renders 01:01:01.
- 90061 renders 25:01:01, preserving hours above 24.
- A negative input renders 00:00:00.
- Rerendering the component never starts or ends attendance or a task timer.

## Checks and limits

Run npm run build and npm run test:phase3. Eight focused tests cover password verification, IP forwarding, scoped fixture reads, heartbeat timeout, maximum shift, shift totals, Dhaka month boundaries and workday classification.

Run npm run test:phase3:db against the migrated local database to check concurrent logins and the persisted forgotten-logout cutoff. The check creates and removes only its own randomly identified fictional staff record.

Database integration and browser flows remain unverified in this restricted session because database connections return EACCES. OTP consumption concurrency, full login-to-logout behavior, migration compatibility, correction transactions and task timer constraints need the live database walkthrough. The runtime checks are not a production security assessment.

Current limitations include a fixed default role model with separate attendance flags, basic full-name/display-name onboarding, and API-only schedule administration. Optional staff profile fields and configurable granular role permissions remain outstanding.
