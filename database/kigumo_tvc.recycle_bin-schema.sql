/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `recycle_bin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `original_table` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_id` int NOT NULL,
  `data_snapshot` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `deleted_by` int DEFAULT NULL,
  `deleted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `restore_deadline` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `deleted_by` (`deleted_by`),
  KEY `idx_restore_deadline` (`restore_deadline`),
  KEY `idx_original_table` (`original_table`),
  KEY `idx_recycle_deleted_at` (`deleted_at`),
  KEY `idx_recycle_deadline` (`restore_deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=750012;
