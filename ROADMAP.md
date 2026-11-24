# Build roadmap

Work at 2–3 hours per session. Use milestone acceptance to plan the next block. The original six-week sketch was for a smaller app. Budget roughly seven to nine weeks of part-time work for this broader scope and pilot. Review progress at the end of each phase.

| Phase | Build in this order | Toshin's practice task | Demo |
|---|---|---|---|
| 0 · Setup | Inspect workspace, attach reference, review rules, plan directory structure and local commands | Describe the website handoff using the CSV | Checklist and build order agreed |
| 1 · Calendar and shell | Scaffold React, build desktop layout, calendar, dashboard, company profile and task drawer with sample data | Write calendar day cells and attendance/deadline badges | Change date or filter and open a task from a day |
| 2 · SQL foundation | Add Express and MySQL migrations, seed data, company/project/task APIs and Board. Wire up linked companies, projects, work types and multi-assignee tasks | Write and explain one filtered SQL query and call it from React | Tasks persist after a reload and company counters update |
| 3 · Accounts and attendance | Implement invite, emailed OTP, login and onboarding, scoped roles, office-network checks, attendance, task timers and team/month calendar views | Implement a pure elapsed-time display component and its edge cases | Two test staff log in, track hours and log out without duplicates |
| 4 · Delivery flow | Add review and final completion, progress, filters, Activity, checklists, subtasks, notes, mentions, files, dependencies, recurrence, and notifications | Implement the task status and deadline UI with a review state | One real-shaped work item goes from assignment through lead approval |
| 5 · Timeline and hosting readiness | Add Timeline, polish desktop screens, verify mobile-data rejection, configure hPanel MySQL, email, scheduled jobs, staging and backups | Compare SQL totals against hand-calculated times and test low bandwidth | Private staging passes the launch checks |
| 6 · Pilot | Run one working-week pilot with a real client website project. Test missed logout and fix high-impact issues. Practice the restore before broader rollout | Run a demo and collect concrete team feedback | Production launch decision based on the pilot |

For each phase, finish the normal user journey before polishing. Update the relevant documentation as decisions change. Use ACCEPTANCE.md as the release checklist.

