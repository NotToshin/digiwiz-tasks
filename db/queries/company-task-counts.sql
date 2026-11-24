-- One input row per task. Assignees do not participate in this aggregate.
-- Supply the company ID as the parameter, for example example-retail.
SELECT c.id, c.name,
       COUNT(t.id) AS total_tasks,
       COALESCE(SUM(t.status = 'Done'), 0) AS completed_tasks,
       COALESCE(SUM(t.status = 'Waiting for Client'), 0) AS waiting_tasks
FROM companies AS c
LEFT JOIN projects AS p ON p.company_id = c.id
LEFT JOIN tasks AS t ON t.project_id = p.id
WHERE c.id = ?
GROUP BY c.id, c.name;
