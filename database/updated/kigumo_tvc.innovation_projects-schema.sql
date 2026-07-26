/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `innovation_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `participant_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `status` enum('submitted','under_review','approved','rejected') NOT NULL DEFAULT 'submitted',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_project_status` (`status`),
  KEY `fk_project_event` (`event_id`),
  KEY `fk_project_participant` (`participant_id`),
  CONSTRAINT `fk_project_event` FOREIGN KEY (`event_id`) REFERENCES `innovation_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_participant` FOREIGN KEY (`participant_id`) REFERENCES `innovation_participants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
