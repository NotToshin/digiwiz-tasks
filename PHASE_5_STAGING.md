# Phase 5: Private Hostinger staging runbook

Status: local preparation. hPanel confirms the Unlimited plan, expiring 5 November 2027, with seven websites and a Web App creation option. The existing digiwiz.com.bd website is a Web App. Recommended separate staging target is tasks.digiwiz.com.bd, subject to availability and approval. No hosting target was modified. Do not onboard employees until the gates below pass.

## Latest readiness check (24 November 2026)

- Hostinger MCP is registered and enabled at `https://mcp.hostinger.com`. The CLI reports authentication as `Unsupported`, and the account operations are not exposed to the active session. The signed-in hPanel Websites page independently verifies the plan and existing DIGIWIZ Web App. The exact staging subdomain and repository settings are pending.
- Frontend and server TypeScript checks passed. The production frontend build passed in 512 ms. Initial JavaScript is 464.57 kB (139.00 kB gzip); CSS is 17.30 kB (4.67 kB gzip); the separate Timeline chunk is 4.22 kB (1.32 kB gzip).
- All eight Phase 3 focused tests passed. The MySQL diagnostic still returned `EACCES` for the local connection. Live database and network acceptance tests are outstanding.

## Select the target

- Inspect hPanel Websites and subscription details. Record the plan, available web-app slots, current domain assignments, existing app/repository/branch and latest deployment. The local Git origin is `NotToshin/digiwiz-tasks`; the remote source completeness has not been verified.
- Managed Business/Unlimited or Cloud with Node.js 24: create a separate Web App using Express, root build `npm run build`, and root startup `npm start`. Use an unused staging subdomain under an authorized domain. A VPS is an alternative if the current plan cannot support this runtime, the required proxy configuration or private storage. Do not overwrite an existing marketing site.
- Obtain approval for the selected hosting resource and subdomain before creating it. Use fictional accounts and tasks and restrict access at the configured office boundary from first exposure.
- Current app deliberately refuses production startup. Phase 4's delivery workflow is still absent and the Phase 3 test mail transport is local-only. Complete and verify both before enabling production startup. Adapt startup to the hosting-assigned port and documented proxy topology before deployment; current local API binds port 63479 on loopback.

## Database and environment

1. Provision a new staging MySQL database and dedicated user in hPanel. Configure `DB_HOST=127.0.0.1`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` in private hosting configuration. Do not upload local `.env`, `.local`, mail files or local database files. Use an authorized migration identity with schema privileges, and an application account with only required DML privileges where supported.
2. Build from the root with Node.js 24 and `npm ci`. Verify that the Git branch or archive contains all source, migrations and package-lock.json. Resolve and review the dependency audit before releasing.
3. Take a pre-migration database backup. Run `npm run db:migrate` explicitly before app startup. Run it again to confirm no duplicate migration. On a fictional staging database only, run `npm run db:seed`, `npm run db:check`, `npm run test:phase3:db`, then `npm run accounts:bootstrap` if the fictional admin does not exist.
4. Verify row counts and migration checksums. Stop on errors, keep the existing application version and investigate. For incompatible changes, restore the verified pre-migration backup to a separate database and reconnect only after validation.

## Office access and email

- Confirm the office's stable public IPv4 and IPv6 egress with the administrator. Enter the exact approved ranges in `OFFICE_ALLOWED_CIDRS`; use an empty allowlist until approved. Local loopback ranges are for local testing only. Set `APP_ORIGIN` to the exact HTTPS staging origin.
- Determine the actual reverse-proxy chain using Hostinger support/configuration and controlled observations. Configure only verified proxy IPs/CIDRs in `TRUSTED_PROXY_CIDRS`. Confirm that the outer trusted proxy strips inbound client-supplied forwarding headers before setting its own. Leave trust disabled if there is no proxy. If reliable client IP attribution cannot be established, staging access is blocked pending a supported network design, such as a fixed-egress office VPN.
- Configure transactional SMTP with an authorized sender and server-side credentials. The current `.local/mail` delivery is for local tests and must be replaced with a verified SMTP adapter before staging. Verify delivery to an authorized test inbox, expiry, reuse rejection, rate limits and reset. Keep OTPs and credentials out of logs and source.
- Enforce HTTPS and secure session cookies. Verify the application rejects unauthorized API calls and all data is scoped to authenticated staff. Use two fictional accounts; confirm logout and deactivation revoke access.

## Scheduled jobs and private attachments

- Configure a minute-level attendance reconciliation job invoking `server/reconcile.ts` with Node.js 24 and the same private database variables. Hostinger cron runs in UTC and does not automatically inherit application environment variables. Confirm the actual deployed path and privately load the same configuration per the official cron instructions. Check successful logs and run twice to confirm idempotence.
- Deadline reminders and recurrence generation are planned Phase 4 jobs; implement and test them before enabling their schedules. Do not configure nonexistent jobs. Avoid always-running workers and inbound WebSockets.
- Enable attachments only after the scoped Phase 4 attachment service exists. Store files outside the public web root, on provider-confirmed persistent storage or a private object bucket. Use a dedicated private directory configured via `PRIVATE_UPLOAD_DIR`; enforce size/type restrictions and an authorized download route. Verify no direct static URL exposes files, and that a redeployment preserves uploaded files.

## Backup and restore drill

- Verify hPanel database and website backup coverage and retention for the exact plan. Create an additional encrypted off-host database backup and separate private attachment backup before migrations. Record timestamps/checksums without credentials. Use a restricted destination and test retention with the owner.
- Restore both parts into separate staging resources using a matching source revision. Validate schema version, table counts, task/assignment relationships, attendance totals, attachment checksums and permission-filtered downloads. Record recovery time and latest recoverable timestamp. Keep the original database intact.

## Acceptance evidence before employee onboarding

| Test | Expected | Evidence |
|---|---|---|
| Office Wi-Fi and wired | HTTPS UI loads; invited fictional users sign in | Pending actual office network |
| Mobile data, Wi-Fi disabled | UI and API rejected at server boundary | Pending actual mobile network |
| Home connection | UI, API and private downloads rejected | Pending real network |
| Proxy configuration | Forwarding accepted only from verified proxy | Unit coverage exists; live proxy pending |
| Access scope | Unauthorized company/task counts and files inaccessible | Fixture unit test only; live staging pending |
| Database migrations and restore | Repeatable; restore checked | Pending live database |
| OTP and reset | Correct delivery and single use | Local file adapter only; live email pending |
| Attendance | Concurrent login, lost heartbeat, Dhaka midnight | Pure tests exist; database/staging pending |
| Delivery | Approval, dependencies, immutable Done and follow-up | Phase 4 pending |
| Private attachment restore | File persisted, restored and scoped | Pending implementation |
| Desktop/low bandwidth | 1440x1024 and 1280x720, Timeline and Calendar navigation | Build only; browser verification pending |

Do not mark acceptance complete based on the build alone. Record date, tester, network, target and result for each live test. Roll back to the prior release and keep staging restricted if any access or data-integrity check fails.

## Local walkthrough and practice

Run `npm run dev:sample` and open Timeline. Navigate months, select Website Launch, and open a task from its date bar. Each assignment appears once regardless of assignee count. The timeline uses the date assigned as the start because a separate start date is not yet available.

Toshin's exercise: add a Today marker to the grid in `src/features/timeline/TimelinePage.tsx`. It should be visible only when today falls inside the selected month and should not change task bar positions or keyboard navigation.

Official provider references:

- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/
- https://www.hostinger.com/support/how-to-run-cron-jobs-for-node-js-websites-at-hostinger/
- https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/
