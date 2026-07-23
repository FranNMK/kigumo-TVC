/*!40014 SET FOREIGN_KEY_CHECKS=0*/;
/*!40101 SET NAMES binary*/;
CREATE TABLE `materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `course_id` int NOT NULL,
  `uploaded_by` int NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `public_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Cloudinary public_id for file management and deletion',
  `resource_type` varchar(20) COLLATE utf8mb4_general_ci DEFAULT 'raw' COMMENT 'Cloudinary resource_type: image or raw',
  PRIMARY KEY (`id`) /*T![clustered_index] CLUSTERED */,
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_materials_course` (`course_id`),
  KEY `idx_materials_uploaded_by` (`uploaded_by`),
  KEY `idx_public_id` (`public_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=210002;
