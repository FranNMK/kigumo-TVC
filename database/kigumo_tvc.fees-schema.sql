/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `fees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `year_of_study` int NOT NULL,
  `tuition` decimal(10,2) DEFAULT '0.00',
  `examination` decimal(10,2) DEFAULT '0.00',
  `registration` decimal(10,2) DEFAULT '0.00',
  `id_card` decimal(10,2) DEFAULT '0.00',
  `other` decimal(10,2) DEFAULT '0.00',
  `other_label` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `last_updated` date DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_fees_course` (`course_id`),
  KEY `idx_fees_course_year` (`course_id`,`year_of_study`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
