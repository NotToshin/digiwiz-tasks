CREATE TABLE IF NOT EXISTS accounts (
 staff_id VARCHAR(64) PRIMARY KEY,
 email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(256) NOT NULL,
 role ENUM('Superadmin','Lead','Staff') NOT NULL DEFAULT 'Staff',
 full_name VARCHAR(160) NOT NULL DEFAULT '',
 onboarded BOOLEAN NOT NULL DEFAULT FALSE,
 employment_start DATE NOT NULL,
 can_correct_attendance BOOLEAN NOT NULL DEFAULT FALSE,
 can_view_attendance BOOLEAN NOT NULL DEFAULT FALSE,
 FOREIGN KEY(staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS invites (
 email VARCHAR(254) PRIMARY KEY,
 staff_id VARCHAR(64) NOT NULL UNIQUE,
 role ENUM('Superadmin','Lead','Staff') NOT NULL DEFAULT 'Staff',
 expires_at BIGINT NOT NULL,
 consumed BOOLEAN NOT NULL DEFAULT FALSE,
 FOREIGN KEY(staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_challenges (
 email VARCHAR(254) NOT NULL,
 purpose ENUM('register','reset') NOT NULL,
 digest CHAR(64) NOT NULL,
 expires_at BIGINT NOT NULL,
 attempts INT NOT NULL DEFAULT 0,
 PRIMARY KEY(email,purpose)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_sessions (
 digest CHAR(64) PRIMARY KEY,
 staff_id VARCHAR(64) NOT NULL,
 csrf CHAR(64) NOT NULL,
 expires_at BIGINT NOT NULL,
 FOREIGN KEY(staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_attempts (
 bucket CHAR(64) PRIMARY KEY,
 started_at BIGINT NOT NULL,
 attempts INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS attendance_sessions (
 id CHAR(36) PRIMARY KEY,
 staff_id VARCHAR(64) NOT NULL,
 started_at BIGINT NOT NULL,
 ended_at BIGINT NULL,
 last_contact BIGINT NOT NULL,
 needs_review BOOLEAN NOT NULL DEFAULT FALSE,
 reason VARCHAR(250) NOT NULL DEFAULT '',
 open_staff VARCHAR(64) GENERATED ALWAYS AS (CASE WHEN ended_at IS NULL THEN staff_id ELSE NULL END) STORED,
 UNIQUE KEY one_open_attendance(open_staff),
 KEY attendance_staff(staff_id,started_at),
 FOREIGN KEY(staff_id) REFERENCES staff(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS task_intervals (
 id CHAR(36) PRIMARY KEY,
 staff_id VARCHAR(64) NOT NULL,
 task_id VARCHAR(64) NOT NULL,
 attendance_id CHAR(36) NOT NULL,
 started_at BIGINT NOT NULL,
 ended_at BIGINT NULL,
 open_staff VARCHAR(64) GENERATED ALWAYS AS (CASE WHEN ended_at IS NULL THEN staff_id ELSE NULL END) STORED,
 UNIQUE KEY one_open_timer(open_staff),
 FOREIGN KEY(staff_id) REFERENCES staff(id),
 FOREIGN KEY(task_id) REFERENCES tasks(id),
 FOREIGN KEY(attendance_id) REFERENCES attendance_sessions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS time_corrections (
 id CHAR(36) PRIMARY KEY,
 interval_id CHAR(36) NOT NULL,
 interval_type ENUM('attendance','task') NOT NULL,
 editor_id VARCHAR(64) NOT NULL,
 original_start BIGINT NOT NULL,
 original_end BIGINT NOT NULL,
 corrected_start BIGINT NOT NULL,
 corrected_end BIGINT NOT NULL,
 reason VARCHAR(1000) NOT NULL,
 created_at BIGINT NOT NULL,
 FOREIGN KEY(editor_id) REFERENCES staff(id),
 KEY correction_interval(interval_type,interval_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
