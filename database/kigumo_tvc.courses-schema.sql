/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `duration_years` int NOT NULL,
  `module_count` int DEFAULT '6',
  `department_id` int NOT NULL,
  `examining_body` enum('KNEC','KASNEB','CDACC','Internal') COLLATE utf8mb4_general_ci NOT NULL,
  `cbet_status` tinyint(1) DEFAULT '0',
  `entry_requirements` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_courses_dept` (`department_id`),
  KEY `idx_courses_active` (`is_active`),
  KEY `idx_courses_dept_active` (`department_id`,`is_active`),
  KEY `idx_courses_exam_body` (`examining_body`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=210002;
