/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `body` text COLLATE utf8mb4_general_ci NOT NULL,
  `scope` enum('college_wide','department') COLLATE utf8mb4_general_ci DEFAULT 'college_wide',
  `department_id` int DEFAULT NULL,
  `posted_by` int NOT NULL,
  `posted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `department_id` (`department_id`),
  KEY `posted_by` (`posted_by`),
  KEY `idx_ann_scope_dept` (`scope`,`department_id`),
  KEY `idx_ann_posted_by` (`posted_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=60003;
