# Phase 2 local setup

Use Node.js 24. Run npm ci from the project root. package-lock.json is the current dependency lock.

## Database

Start your local MySQL or MariaDB server. Create a dedicated database named digiwiz_tasks with utf8mb4 encoding. Copy .env.example to .env and supply DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME for that database. The application does not create a database or apply migrations on startup.

Run these commands in order:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:check
npm.cmd run api
```

In a second terminal run npm.cmd run dev and open http://127.0.0.1:63477.

The production frontend can be served locally by npm.cmd run build followed by npm.cmd start at http://127.0.0.1:63479. Phase 2 startup rejects NODE_ENV=production because account and office access controls belong to Phase 3.

For the original fixtures without a database, run npm.cmd run dev:sample. This explicitly selects a read-only sample preview. An API failure shows a retry message.

## Walkthrough

Open Manage work. Create a company, then a project, then a task with two assignees. Reload the browser and open the company profile. The task should appear once, with both assignees. Change its deadline and notes, save and reload. Inspect the Calendar and Board.

The local fictional team is added to every new project. User accounts, role scope, notifications, and real office attendance follow in later phases. Task completion and submission to review are reserved for Phase 4. Existing completed tasks are immutable. Existing In Review tasks can retain their status while details are edited.

Task updates require the version returned by GET /api/workspace or GET /api/tasks. Concurrent stale updates return 409. Task edits, assignee replacement and change_history insertion share a transaction.

## API

- GET /api/health checks database connectivity.
- GET /api/workspace supplies a consistent workspace snapshot.
- GET /api/companies, /api/projects and /api/tasks list records.
- Project lists accept companyId and task lists accept projectId.
- POST and PUT /api/companies, /api/projects and /api/tasks create and update records. PUT requires /:id.
- GET /api/companies/:id/counts returns task totals, completed and waiting counts.
- Request bodies reject unknown fields, invalid dates, empty required text and duplicate assignees.

## Toshin's exercise

Read db/queries/company-task-counts.sql. The query joins companies to projects and tasks. Each task contributes one row. Its assignees are stored separately, so adding an assignee cannot change COUNT(t.id). LEFT JOIN retains companies with zero tasks.

Add an in-progress count to the query using SUM(t.status = 'In Progress') with COALESCE. Fetch /api/companies/example-retail/counts from the company page and display it.

Success means the count agrees with the task list, zero-task companies show zero, and changing the handoff from one assignee to two never changes the total. npm run db:check verifies the assignment invariant using a rolled-back transaction.

## Verification status

Frontend and server TypeScript checks and the Vite build passed. Database migration execution, seed execution, API persistence and browser interaction remain unverified in this restricted session. Local database connections failed with EACCES and the isolated named-pipe server could not be reached. Run db:check after local setup.

The install reported six dependency vulnerabilities. The advisory details and fixes remain unverified because registry access is unavailable. Review npm audit before deployment.
