/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `type` enum('academic','non_academic') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'academic',
  `description` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image_path` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `vision` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `mission` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `objective` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_dept_type` (`type`),
  KEY `idx_departments_id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=210002;
