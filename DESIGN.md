# Design direction

Use the supplied reference for the desktop composition. Prioritize a dark fixed rail, a light rounded workspace, high-contrast typography, soft blue/lavender/amber accents, compact summary cards, and a right-hand job/backlog panel. Build DIGIWIZ-branded components and original icons or illustrations. Use the screenshot as the visual review target for spacing, visual hierarchy, and overall feel.

## Screens

Use Poppins across the workspace. Keep the rail header icon-only, with an accessible name for the home link. Page headers identify the current view.

| Route | Main content |
|---|---|
| Dashboard | Date and quick actions, Working today counter, due-today card, project progress summary, calendar preview, backlog panel |
| Calendar | Month grid by default, attendance and due-date filters, current day indicator, staff filter for authorized managers, day details |
| Companies | Searchable company list, logo and job counts, company detail with projects, jobs, and activity |
| Project | Header with company, lead and progress, then Board and Timeline tabs with project activity |
| My Tasks | Today's, upcoming, overdue, assigned and review work |
| Activity | Visible company and project events with date, work type, actor and status filters |
| Notifications | Unread count, deep links, mark read, assignment and review events |
| Settings | Own profile and permitted controls for roles, office network, work types, schedules and holidays |

Task details open in a side panel from Calendar or Board and have a stable URL. Show assignees, work type, deadline, phase, waiting or blocked reason, checklist, comments and activity without leaving context. Board supports moving by menu and, if implemented, drag and drop. Timeline starts as a lightweight horizontal date grid showing start and delivery dates and one row per task or project.

Desktop light mode is the release target. Check the 1440×1024 reference size and a smaller 1280×720 desktop viewport with readable tables, keyboard focus, and a scrollable workspace. Use text or icons as well as color for state. Load Calendar, Board, and Timeline as separate routes or lazy chunks. Use simple CSS and lightweight components.

