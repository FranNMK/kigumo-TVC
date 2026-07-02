/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `slider_slides` (
  `id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `heading` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtext` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `btn1_text` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `btn1_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `btn2_text` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `btn2_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `created_by` (`created_by`),
  KEY `idx_slider_active_sort` (`is_active`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci AUTO_INCREMENT=90002;
