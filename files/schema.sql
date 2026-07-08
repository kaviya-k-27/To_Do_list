-- ============================================================
-- To-Do List Application - Database Schema
-- ============================================================



-- ------------------------------------------------------------
-- Table: tasks
-- ------------------------------------------------------------
-- status:
--   'active'    -> task not yet completed, due today or in the future
--   'completed' -> task marked done
--   (Pending is NOT a stored status. A task is "pending" purely
--    because task_date < today AND status = 'active'. This is
--    computed on read, so no cron job / background process is
--    required to "move" tasks between sections.)
-- ------------------------------------------------------------
CREATE TABLE tasks
(
    id INT AUTO_INCREMENT PRIMARY KEY,

    task_name VARCHAR(255) NOT NULL,

    task_date DATE NOT NULL,

    task_time TIME NOT NULL,

    status VARCHAR(20) DEFAULT 'active',

    created_at DATETIME,

    completed_at DATETIME
);

-- ------------------------------------------------------------
-- Sample data (optional - remove in production)
-- ------------------------------------------------------------
-- INSERT INTO tasks (task_name, task_date, task_time, status, created_at)
-- VALUES
-- ('Submit project report', CURDATE(), '17:00:00', 'active', NOW()),
-- ('Call the dentist', DATE_SUB(CURDATE(), INTERVAL 2 DAY), '10:00:00', 'active', DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- ('Buy groceries', CURDATE(), '18:30:00', 'completed', NOW());
