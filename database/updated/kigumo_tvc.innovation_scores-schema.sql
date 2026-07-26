/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `innovation_scores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `participant_id` int NOT NULL,
  `event_id` int NOT NULL,
  `category_id` int NOT NULL,
  `coordinator_id` int NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uk_score_participant_category` (`participant_id`,`category_id`,`event_id`),
  KEY `idx_score_event_category` (`event_id`,`category_id`),
  KEY `fk_score_category` (`category_id`),
  KEY `fk_score_coordinator` (`coordinator_id`),
  CONSTRAINT `fk_score_participant` FOREIGN KEY (`participant_id`) REFERENCES `innovation_participants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_score_event` FOREIGN KEY (`event_id`) REFERENCES `innovation_events` (`id`),
  CONSTRAINT `fk_score_category` FOREIGN KEY (`category_id`) REFERENCES `innovation_skills_categories` (`id`),
  CONSTRAINT `fk_score_coordinator` FOREIGN KEY (`coordinator_id`) REFERENCES `innovation_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=30001;
