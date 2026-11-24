# Architecture and Hostinger

## Application

- React + Vite + TypeScript, React Router, and a SQL-backed Node.js + Express + TypeScript API.
- One same-origin deployment. Express serves the Vite production build and /api routes. Build from the repository root. Keep one root build and start command and a documented health endpoint. Use Node.js 24 as the target and verify current support in hPanel before locking it.
- Use Hostinger's MySQL offering, with a migration runner and parameterized queries via mysql2. Use local MySQL for parity. Set Unicode (utf8mb4), a small connection pool, predictable indexed lookup patterns, and migrations applied explicitly before app startup. Use route-level code splitting, paginated activity lists and an authenticated notification refresh. Keep initial bundles small and skip heavy chart or scheduler libraries.
- Key tables: staff, invites, email verification and reset challenges, auth sessions, teams, staff team memberships, roles, role permissions, staff role assignments, office networks, companies, projects, project members, work types, tasks, task assignees, checklist items, task dependencies, recurrence rules, comments, attachments, change history, notifications, attendance sessions, attendance corrections, work schedules, holidays, and task-time intervals.
- Use database transactions and uniqueness constraints for OTP consumption, one open attendance session and one open task timer per staff member, task completion + review events, recurring occurrences, and reminder deduplication. Handle retries and concurrency without duplicate events. Separate temporary authentication state from durable attendance. Store passwords and challenges securely, use HTTPS and secure session cookies, protect write requests, and rate-limit authentication. Use attachment checks, a private persistent file location, and authorized download routes. Large source media can remain in external file links.
- Suggested route groups: /api/auth, /api/me, /api/companies, /api/projects, /api/tasks, /api/activity, /api/calendar, /api/attendance, /api/notifications, /api/admin. Every private handler applies permission and office-network checks.

## Office network

Allow approved office public egress IP addresses or ranges at the server boundary and verify IPv4/IPv6 behavior. Wi-Fi network names are unavailable to the server. A connection that exits through an approved office IP passes the network rule, including office wired access. Ordinary mobile-data and home connections should fail unless they share that egress. Verify stable public IPs with the ISP. An office VPN with fixed egress is an option for dynamic/shared IPs or stricter control. Use precise trusted proxy settings verified against the real hosting path. Never trust arbitrary forwarding headers. Apply the restriction to the UI, auth, API, and file routes. Provide controlled out-of-band recovery via hosting configuration to prevent office IP changes from locking out Superadmin.

## Deployment checklist

1. Identify the existing plan in hPanel. Managed Node.js is documented for Business/Unlimited and eligible Cloud plans. A VPS is an alternative. Check for a Node.js Web App option and use a dedicated app subdomain. Keep it separate from the marketing website.
2. Create a dedicated hPanel MySQL database and app DB user. Hostinger documents 127.0.0.1 for the managed local connection. Configure server variables privately and test the database. Confirm backup coverage.
3. Verify SMTP or a transactional email provider through test delivery to a real staff test inbox, with authorization for that test. Keep mail credentials server-side.
4. Confirm recurring tasks, deadline reminders, and attendance reconciliation via a supported scheduled job. Use idempotent jobs, conditional activity polling, and no required always-running worker or inbound WebSocket. Confirm persistent private-file storage or use a private object store before enabling uploads.
5. Validate HTTPS, proxy header behavior, office/mobile access tests, migration on a test database, and a database/file restore. Then publish to the chosen office subdomain and onboard pilot staff.

Account plan status remains unverified. If the existing plan only hosts static React, keep the local MySQL build and confirm an eligible Hostinger runtime before choosing a deployment change.

## Official references

- [Node.js deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [MySQL connection](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Managed Node.js limits](https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/)

