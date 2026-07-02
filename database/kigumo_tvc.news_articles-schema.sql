/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `news_articles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `body` longtext COLLATE utf8mb4_general_ci NOT NULL,
  `category` enum('event','partnership','graduation','achievement','general') COLLATE utf8mb4_general_ci DEFAULT 'general',
  `image_path` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `published_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `created_by` (`created_by`),
  KEY `idx_news_published` (`is_published`),
  KEY `idx_news_published_date` (`is_published`,`published_at`),
  KEY `idx_news_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=60002;
