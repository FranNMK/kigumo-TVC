/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `intake_dates_global` (
  `id` int NOT NULL AUTO_INCREMENT,
  `label` varchar(150) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'e.g. January 2026',
  `intake_date` date NOT NULL COMMENT 'Reporting / start date',
  `application_deadline` date NOT NULL COMMENT 'Last day to apply',
  `programs_available` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'All Diploma & Certificate',
  `status` enum('open','upcoming','closed') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_intake_year` (`intake_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=30002;
