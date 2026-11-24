# Attendance and task time

## Office attendance

- A successful email-and-password login from an approved office network starts an attendance session. Logout ends it. Page refresh, tab changes, and repeat logins never start duplicate work sessions. The dashboard shows the server-derived daily total plus the open session and updates the display locally.
- Record explicit start and end timestamps in UTC. Convert to Asia/Dhaka for daily and monthly displays. Split a valid cross-midnight interval at local midnight. Add multiple shifts on one day without overlaps. Time runs between check-in and check-out, including idle time while the staff member remains connected. Break deductions are a separate policy if DIGIWIZ wants them.
- Proposed forgotten-logout rule: while the app is open on the allowed network, send a heartbeat every 60 seconds. After 10 minutes without a valid heartbeat, close attendance at the last confirmed contact and mark it Needs Review. Apply a configurable maximum shift limit with a conservative initial value of 12 hours as an additional safeguard. Show the reason and let an authorized administrator correct it. Reauthenticate to resume after a session was closed. Reconcile by scheduled command and on attendance reads so the counter cannot keep growing behind a closed browser.
- Attendance correctors enter a reason and keep both original and corrected intervals and the editor identity. Validate chronological order and overlapping shifts. Calculate monthly totals from reconciled intervals with integer seconds and display a provisional total when an affected interval awaits review.
- Proposed leave rule: if a scheduled workday has elapsed without a valid sign-in, show Leave in the calendar. Leave future dates unclassified, show configured non-workdays as Off and holidays as Holiday, and keep an optional separately recorded approved leave reason private. Configure schedule, holidays and employment dates before live use. Absence before the employee's start or after deactivation is outside the schedule.
- Calendar filters show attendance, deadlines or both. Staff see their own attendance by default. Authorized managers can view team attendance and select month and staff member. A day details panel shows sessions, totals and corrections where authorized.

## Task time

- Task timers are manual start and stop with a maximum of one running per staff member during an open attendance session. Several assigned people can time the same task independently.
- A logout or automatic attendance close ends any running task timer at the same cutoff. Record closed intervals and allow authorized corrections with an audit reason. Summarize time by task, project and staff member as permitted. Attendance totals come only from attendance intervals, so task time never double-counts work hours.

## Confirm during the pilot setup

Confirm the working week and holidays, maximum shift length, whether lunch should be deducted, and who can correct hours. The defaults above are proposed to keep the local build moving.

