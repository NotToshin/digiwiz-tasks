CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  initials VARCHAR(8) NOT NULL,
  kind ENUM('Client', 'Internal') NOT NULL,
  description TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(64) PRIMARY KEY,
  display_name VARCHAR(160) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS work_types (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  lead_id VARCHAR(64) NOT NULL,
  target_date DATE NOT NULL,
  summary TEXT NOT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (lead_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_members (
  project_id VARCHAR(64) NOT NULL,
  staff_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (project_id, staff_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  work_type_id VARCHAR(64) NOT NULL,
  assigned_on DATE NULL,
  delivery_date DATE NOT NULL,
  status ENUM('Backlog', 'To Do', 'In Progress', 'Waiting for Client', 'In Review', 'Done') NOT NULL,
  details TEXT NOT NULL,
  notes TEXT NOT NULL,
  requires_review BOOLEAN NOT NULL DEFAULT FALSE,
  prerequisite_id VARCHAR(64) NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY task_project (id, project_id),
  KEY task_deadline (delivery_date),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (work_type_id) REFERENCES work_types(id),
  FOREIGN KEY (prerequisite_id, project_id) REFERENCES tasks(id, project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_assignees (
  task_id VARCHAR(64) NOT NULL,
  project_id VARCHAR(64) NOT NULL,
  staff_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (task_id, staff_id),
  FOREIGN KEY (task_id, project_id) REFERENCES tasks(id, project_id),
  FOREIGN KEY (project_id, staff_id) REFERENCES project_members(project_id, staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS change_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  actor_id VARCHAR(64) NOT NULL,
  before_json JSON NULL,
  after_json JSON NOT NULL,
  occurred_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY history_entity (entity_type, entity_id, id),
  FOREIGN KEY (actor_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
