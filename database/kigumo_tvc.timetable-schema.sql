/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `timetable` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `course_id` int NOT NULL,
  `lecturer_id` int NOT NULL,
  `subject` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `day` enum('Mon','Tue','Wed','Thu','Fri') COLLATE utf8mb4_general_ci NOT NULL,
  `time_start` time NOT NULL,
  `time_end` time NOT NULL,
  `room` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `idx_timetable_dept` (`department_id`),
  KEY `idx_timetable_dept_day` (`department_id`,`day`),
  KEY `idx_timetable_lecturer` (`lecturer_id`),
  KEY `idx_timetable_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=30002;
