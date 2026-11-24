# Workflow and access

## Tasks and progress

- Statuses: Backlog, To Do, In Progress, Waiting for Client, In Review, and Done. Waiting for Client stays visible and retains its deadline until an authorized user changes it.
- Staff can create tasks in projects they can access. The proposed starting policy lets an assignee reschedule or reassign their own task among eligible project members. Log old and new values and notify affected assignees and the lead. A shared task has one shared delivery deadline. Use an assigned subtask when an individual needs a separate deadline.
- Multiple assignees are supported. Show one task card and optional separate assignee time totals. Moving the task changes its status for everyone. Date assigned is set at first assignment. Later assignment changes appear in activity.
- A teammate can mark a task as requiring lead approval. Submission moves it to In Review and notifies the authorized lead. The lead can approve to Done or return it to In Progress with a written reason. Only authorized reviewers can approve. Tasks without required review may be completed by an authorized teammate.
- Done is final. “Create follow-up” opens an editable new task linked to the original. Preserve the original record and history.
- Show the status, completed checklist count, latest progress note and active timer where permitted. Project progress is completed active top-level tasks divided by all active top-level tasks, with a clear empty state. Include subtasks in their parent's checklist/progress display separately and count generated recurring occurrences only once per task. Show Waiting for Client and overdue counts alongside progress.
- For release one, support weekly and monthly recurrence, one generated task per rule and scheduled occurrence, and finish-to-start dependencies within a project. Reject cycles and prevent starting a dependent task until its prerequisite is Done. Use a separate immutable ID for each generated occurrence.
- Store UTC instants for events and timers. Use date-only values for delivery dates. A date-only deadline ends at local midnight in Asia/Dhaka. Show due today and overdue from server-side date rules.

## Staff accounts and permissions

- Sign-up accepts any email provider. Registration requires a staff invite issued by Superadmin to that chosen address. Send a short-lived, single-use email OTP to verify ownership. Then the staff member sets a password and signs in using email and password. Use a separate password-reset flow, retry limits, secure sessions, and revocation for deactivated staff.
- First sign-in starts the work session and opens profile onboarding. Required fields: full name and display name. Admin-controlled fields: staff ID, team, job title, employment start date, and roles. Optional profile fields: work phone, avatar, skills, short bio, and preferred name. Collect additional sensitive HR fields only after DIGIWIZ identifies a business need and approves access. The draft profile does not request NID, home address, banking details, or health data.
- Superadmin configures role permissions and scope, activates or deactivates staff, and manages office-network and attendance settings. Protect the last active Superadmin. Default roles below are a starting configuration.
- **Lead:** sees assigned projects and their activity, can manage their project team and review tasks if granted. Access to staff attendance across the agency is a separate permission.
- **Staff:** sees projects they belong to, manages permitted tasks there, and sees their own attendance. Company overview counts, search, notifications, comments, file downloads and activity must enforce the same visibility rules as direct task requests.
- Evaluate permissions by action plus resource scope on every protected request. Keep platform administration and project membership separate. Record role, deadline, review, and access-sensitive changes as append-only audit events. Filter business Activity before displaying it. Keep sensitive administration and attendance events out of shared Activity.

