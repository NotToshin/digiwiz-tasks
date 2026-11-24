ALTER TABLE tasks ADD COLUMN priority ENUM('Low','Normal','High','Urgent') NOT NULL DEFAULT 'Normal', ADD COLUMN follow_up_id VARCHAR(64) NULL, ADD COLUMN review_feedback TEXT NULL, ADD CONSTRAINT follow_up_same_project FOREIGN KEY (follow_up_id,project_id) REFERENCES tasks(id,project_id);

CREATE TABLE IF NOT EXISTS notifications (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 staff_id VARCHAR(64) NOT NULL,
 task_id VARCHAR(64) NOT NULL,
 message VARCHAR(250) NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 read_at TIMESTAMP NULL,
 FOREIGN KEY(staff_id) REFERENCES staff(id),
 FOREIGN KEY(task_id) REFERENCES tasks(id),
 KEY recipient(staff_id,read_at,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
