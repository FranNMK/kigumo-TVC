/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `innovation_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `admission_number` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `department_id` int NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  UNIQUE KEY `uk_participant_event` (`event_id`,`admission_number`),
  KEY `idx_participant_dept` (`department_id`),
  KEY `idx_participants_event` (`event_id`),
  KEY `idx_participants_dept` (`department_id`),
  CONSTRAINT `fk_participant_event` FOREIGN KEY (`event_id`) REFERENCES `innovation_events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_participant_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin AUTO_INCREMENT=60001;
