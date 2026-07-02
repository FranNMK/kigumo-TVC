/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `hod_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `lecturer_id` int NOT NULL,
  `assigned_at` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `department_id` (`department_id`),
  KEY `idx_hod_dept` (`department_id`),
  KEY `idx_hod_lecturer` (`lecturer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=270002;
