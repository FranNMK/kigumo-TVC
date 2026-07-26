/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `cohort_batches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `batch_code` varchar(4) NOT NULL COMMENT 'e.g., 2501, 2505, 2601',
  `intake_date` date NOT NULL,
  `label` varchar(100) DEFAULT NULL COMMENT 'e.g., January 2025 Intake',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `unique_dept_batch` (`department_id`,`batch_code`),
  CONSTRAINT `fk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
