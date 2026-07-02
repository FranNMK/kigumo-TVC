/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `intake_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jan_close_day` int NOT NULL DEFAULT '15',
  `may_close_day` int NOT NULL DEFAULT '15',
  `sep_close_day` int NOT NULL DEFAULT '15',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `fk_1` (`updated_by`),
  CONSTRAINT `fk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=90001;
