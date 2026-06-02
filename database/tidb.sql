-- ============================================================
-- KIGUMO TVC - TiDB Compatible Database Export
-- Generated: May 26, 2026
-- ============================================================



CREATE DATABASE IF NOT EXISTS `kigumo_tvc`;
USE `kigumo_tvc`;

-- ============================================================
-- TABLE: announcements
-- ============================================================
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `body` text NOT NULL,
  `scope` enum('college_wide','department') DEFAULT 'college_wide',
  `department_id` int(11) DEFAULT NULL,
  `posted_by` int(11) NOT NULL,
  `posted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `department_id` (`department_id`),
  KEY `posted_by` (`posted_by`),
  KEY `idx_ann_scope_dept` (`scope`,`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `announcements` (`id`, `title`, `body`, `scope`, `department_id`, `posted_by`, `posted_at`) VALUES
(2, 'ICT Department Industrial Attachment', 'All Year 3 ICT students are required to attend the industrial attachment briefing session on Friday 16th January 2026 at 2:00 PM in ICT Lab 1. Attachment letters will be issued during this session.', 'department', 1, 5, '2026-05-21 06:58:25'),
(3, 'College Fee Payment Deadline', 'The deadline for fee payment for the January 2026 semester is 31st January 2026. Students with outstanding balances will not be allowed to sit for continuous assessment tests.', 'college_wide', NULL, 2, '2026-05-21 06:58:25');

-- ============================================================
-- TABLE: bom_members
-- ============================================================
CREATE TABLE `bom_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_bom_active_sort` (`is_active`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bom_members` (`id`, `full_name`, `position`, `photo_path`, `sort_order`, `is_active`, `created_at`) VALUES
(1, 'Hon. Dr. Patrick Nduati Mwangi', 'BOM Chairperson', '', 1, 1, '2026-05-21 06:58:26'),
(2, 'Dr. Jane Muthoni Kariuki', 'Secretary to the Board / Chief Principal', NULL, 2, 1, '2026-05-21 06:58:26'),
(3, 'Mr. Samuel Kariuki Wambugu', 'Member - County Government Representative', NULL, 3, 1, '2026-05-21 06:58:26'),
(4, 'Mrs. Rose Wanjiku Githinji', 'Member - TVETA Representative', NULL, 4, 1, '2026-05-21 06:58:26'),
(5, 'Prof. James Kamande Thuo', 'Member - University Representative', NULL, 5, 1, '2026-05-21 06:58:26'),
(6, 'Mr. Peter Ndung\'u Karanja', 'Member - Industry Representative', NULL, 6, 1, '2026-05-21 06:58:26'),
(7, 'Mrs. Agnes Muthoni Mbugua', 'Member - Community Representative', NULL, 7, 1, '2026-05-21 06:58:26'),
(8, 'Mr. John Kiprotich Bett', 'Member - Staff Representative', NULL, 8, 1, '2026-05-21 06:58:26');

-- ============================================================
-- TABLE: contact_enquiries
-- ============================================================
CREATE TABLE `contact_enquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `contact_enquiries` (`id`, `full_name`, `email`, `subject`, `message`, `submitted_at`, `is_read`) VALUES
(1, 'Francis Mwangi Kienji', 'frankmk2025@gmail.com', 'Admissions', 'jkhggggggggggggggg', '2026-05-21 10:15:32', 1),
(2, 'Francis Mwangi Kienji', 'frankmk2025@gmail.com', 'Partnership', 'Hi i want to paretner', '2026-05-26 07:34:21', 0);

-- ============================================================
-- TABLE: courses
-- ============================================================
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `duration_years` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `examining_body` enum('KNEC','KASNEB','CDACC') NOT NULL,
  `cbet_status` tinyint(1) DEFAULT 0,
  `entry_requirements` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_courses_dept` (`department_id`),
  KEY `idx_courses_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `courses` (`id`, `name`, `duration_years`, `department_id`, `examining_body`, `cbet_status`, `entry_requirements`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Diploma in Information Communication Technology', 3, 1, 'KNEC', 1, 'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English OR Certificate in ICT from a recognized institution.', 'A comprehensive diploma program covering software development, networking, database management, web technologies, and IT support.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(2, 'Certificate in Information Communication Technology', 2, 1, 'KNEC', 1, 'KCSE Mean Grade D+ (Plus) with at least D in Mathematics and English OR KCPE Certificate.', 'A foundational certificate program introducing students to computer applications, basic programming, hardware maintenance, and digital literacy.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(3, 'Diploma in Computer Programming (CDACC)', 3, 1, 'CDACC', 1, 'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English.', 'A competency-based diploma focusing on modern programming languages, software development methodologies, mobile app development, and software testing.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(4, 'Diploma in Business Management', 3, 2, 'KNEC', 1, 'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English or Business Studies.', 'A comprehensive business diploma covering accounting, marketing, human resources, entrepreneurship, and strategic management.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(5, 'Certificate in Secretarial Studies', 2, 2, 'KNEC', 1, 'KCSE Mean Grade D+ (Plus) with at least D in English.', 'A certificate program training students in office administration, typing, document management, and office etiquette.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(6, 'ATD Level 1 & 2 (Accounting Technician Diploma)', 2, 2, 'KASNEB', 0, 'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English.', 'A professional accounting program preparing students for the KASNEB ATD examinations.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(7, 'Diploma in Electrical Engineering', 3, 3, 'KNEC', 1, 'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics, Physics, and English.', 'A diploma program covering electrical installation, power systems, industrial electronics, and renewable energy technologies.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(8, 'Certificate in Mechanical Engineering', 2, 3, 'KNEC', 1, 'KCSE Mean Grade D+ (Plus) with at least D in Mathematics and Physics.', 'A foundational program in mechanical engineering covering workshop technology, fitting, welding, and machine operation.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(9, 'Diploma in Food Production', 3, 4, 'KNEC', 1, 'KCSE Mean Grade C- (Minus) with at least D+ in Home Science or Biology.', 'A culinary arts diploma focusing on professional cooking, baking, food safety, kitchen management, and menu planning.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24'),
(10, 'Certificate in Catering & Accommodation', 2, 4, 'KNEC', 1, 'KCSE Mean Grade D+ (Plus) with at least D in English.', 'A certificate program in catering covering food preparation, service techniques, housekeeping, and hospitality operations.', 1, '2026-05-21 06:58:24', '2026-05-21 06:58:24');

-- ============================================================
-- TABLE: departments
-- ============================================================
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `type` enum('academic','non_academic') NOT NULL DEFAULT 'academic',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `departments` (`id`, `name`, `type`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Information Communication Technology', 'academic', 'Department of ICT offering courses in software development, networking, and computer applications to prepare students for the digital economy.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(2, 'Business Studies', 'academic', 'Department of Business Studies providing training in accounting, secretarial studies, and business management for the corporate world.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(3, 'Engineering & Technical Studies', 'academic', 'Department of Engineering offering hands-on training in electrical, mechanical, and civil engineering technologies.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(4, 'Hospitality & Institutional Management', 'academic', 'Department of Hospitality training students in food production, catering, and hotel management for the hospitality industry.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(5, 'Applied Sciences', 'academic', 'Department of Applied Sciences focusing on analytical chemistry, biology, and laboratory technology for research and industry.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(6, 'Social Work & Community Development', 'academic', 'Department of Social Work preparing students for careers in community development, counseling, and social services.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(7, 'Sports & Games', 'non_academic', 'Department of Sports coordinating all college sports activities.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(8, 'Clubs & Societies', 'non_academic', 'Department overseeing student clubs and societies.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(9, 'Catering & Accommodation', 'non_academic', 'Department managing student meals, cafeteria services, and hostel accommodation.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(10, 'Guidance & Counseling', 'non_academic', 'Department providing psychological support, career guidance, and personal counseling services.', '2026-05-21 06:58:23', '2026-05-21 06:58:23'),
(11, 'Health & Wellness', 'non_academic', 'Department managing the college clinic, health education programs, and student wellness initiatives.', '2026-05-21 06:58:23', '2026-05-21 06:58:23');

-- ============================================================
-- TABLE: downloads
-- ============================================================
CREATE TABLE `downloads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `category` enum('admission','academic','legal','student_welfare') NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `uploaded_by` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_downloads_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `downloads` (`id`, `title`, `category`, `file_path`, `file_size`, `uploaded_at`, `uploaded_by`) VALUES
(1, 'January 2026 Admission Form', 'admission', '/uploads/2026/01/admission-form-2026.pdf', 450, '2026-05-21 06:58:25', 4),
(2, 'Medical Examination Form', 'admission', '/uploads/2026/01/medical-form.pdf', 320, '2026-05-21 06:58:25', 4),
(3, 'College Academic Calendar 2026', 'academic', '/uploads/2026/01/academic-calendar-2026.pdf', 280, '2026-05-21 06:58:25', 2),
(4, 'Examination Timetable January 2026', 'academic', '/uploads/2026/01/exam-timetable-jan2026.pdf', 350, '2026-05-21 06:58:25', 2),
(5, 'TVETA Registration Certificate', 'legal', '/uploads/2026/01/tveta-cert.pdf', 1200, '2026-05-21 06:58:25', 4),
(6, 'College Code of Conduct', 'legal', '/uploads/2026/01/code-of-conduct.pdf', 520, '2026-05-21 06:58:25', 1),
(7, 'Student Insurance Policy Document', 'student_welfare', '/uploads/2026/01/insurance-policy.pdf', 680, '2026-05-21 06:58:25', 3),
(8, 'Hostel Rules and Regulations', 'student_welfare', '/uploads/2026/01/hostel-rules.pdf', 400, '2026-05-21 06:58:25', 3);

-- ============================================================
-- TABLE: fees
-- ============================================================
CREATE TABLE `fees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `year_of_study` int(11) NOT NULL,
  `tuition` decimal(10,2) DEFAULT 0.00,
  `examination` decimal(10,2) DEFAULT 0.00,
  `registration` decimal(10,2) DEFAULT 0.00,
  `id_card` decimal(10,2) DEFAULT 0.00,
  `other` decimal(10,2) DEFAULT 0.00,
  `other_label` varchar(100) DEFAULT NULL,
  `last_updated` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fees_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `fees` (`id`, `course_id`, `year_of_study`, `tuition`, `examination`, `registration`, `id_card`, `other`, `other_label`, `last_updated`) VALUES
(1, 1, 1, 25000.00, 5000.00, 1000.00, 500.00, 3000.00, 'Computer Lab Fee', '2026-01-05'),
(2, 1, 2, 25000.00, 5000.00, 1000.00, 500.00, 3000.00, 'Computer Lab Fee', '2026-01-05'),
(3, 1, 3, 25000.00, 5000.00, 1000.00, 500.00, 3000.00, 'Computer Lab Fee', '2026-01-05'),
(4, 2, 1, 18000.00, 4000.00, 1000.00, 500.00, 2000.00, 'Computer Lab Fee', '2026-01-05'),
(5, 2, 2, 18000.00, 4000.00, 1000.00, 500.00, 2000.00, 'Computer Lab Fee', '2026-01-05'),
(6, 3, 1, 28000.00, 5000.00, 1000.00, 500.00, 3500.00, 'Programming Lab Fee', '2026-01-05'),
(7, 3, 2, 28000.00, 5000.00, 1000.00, 500.00, 3500.00, 'Programming Lab Fee', '2026-01-05'),
(8, 3, 3, 28000.00, 5000.00, 1000.00, 500.00, 3500.00, 'Programming Lab Fee', '2026-01-05'),
(9, 4, 1, 22000.00, 5000.00, 1000.00, 500.00, 1500.00, 'Resource Fee', '2026-01-05'),
(10, 4, 2, 22000.00, 5000.00, 1000.00, 500.00, 1500.00, 'Resource Fee', '2026-01-05'),
(11, 4, 3, 22000.00, 5000.00, 1000.00, 500.00, 1500.00, 'Resource Fee', '2026-01-05'),
(12, 5, 1, 16000.00, 4000.00, 1000.00, 500.00, 1500.00, 'Typing Lab Fee', '2026-01-05'),
(13, 5, 2, 16000.00, 4000.00, 1000.00, 500.00, 1500.00, 'Typing Lab Fee', '2026-01-05'),
(14, 6, 1, 20000.00, 6000.00, 1500.00, 500.00, 2000.00, 'KASNEB Materials', '2026-01-05'),
(15, 6, 2, 20000.00, 6000.00, 1500.00, 500.00, 2000.00, 'KASNEB Materials', '2026-01-05'),
(16, 7, 1, 30000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Workshop Fee', '2026-01-05'),
(17, 7, 2, 30000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Workshop Fee', '2026-01-05'),
(18, 7, 3, 30000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Workshop Fee', '2026-01-05'),
(19, 8, 1, 20000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Workshop Fee', '2026-01-05'),
(20, 8, 2, 20000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Workshop Fee', '2026-01-05'),
(21, 9, 1, 25000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Kitchen Practical Fee', '2026-01-05'),
(22, 9, 2, 25000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Kitchen Practical Fee', '2026-01-05'),
(23, 9, 3, 25000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Kitchen Practical Fee', '2026-01-05'),
(24, 10, 1, 18000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Practical Fee', '2026-01-05'),
(25, 10, 2, 18000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Practical Fee', '2026-01-05');

-- ============================================================
-- TABLE: gallery_albums
-- ============================================================
CREATE TABLE `gallery_albums` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `event_date` date DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `gallery_albums` (`id`, `title`, `event_date`, `created_by`, `created_at`) VALUES
(1, 'Graduation Ceremony 2025', '2025-12-10', 1, '2026-05-21 06:58:25'),
(2, 'Cultural Day 2025', '2025-11-15', 2, '2026-05-21 06:58:25'),
(3, 'Sports Tournament 2025', '2025-10-20', 11, '2026-05-21 06:58:25');

-- ============================================================
-- TABLE: gallery_photos
-- ============================================================
CREATE TABLE `gallery_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `album_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `caption` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_gallery_album` (`album_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================================
-- TABLE: hod_assignments
-- ============================================================
CREATE TABLE `hod_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `assigned_at` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `department_id` (`department_id`),
  KEY `idx_hod_dept` (`department_id`),
  KEY `idx_hod_lecturer` (`lecturer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `hod_assignments` (`id`, `department_id`, `lecturer_id`, `assigned_at`, `created_at`) VALUES
(1, 1, 5, '2025-01-15', '2026-05-21 06:58:24'),
(2, 2, 6, '2025-01-15', '2026-05-21 06:58:24'),
(3, 3, 7, '2025-01-15', '2026-05-21 06:58:24'),
(4, 4, 8, '2025-01-15', '2026-05-21 06:58:24'),
(5, 5, 9, '2025-01-15', '2026-05-21 06:58:24'),
(6, 6, 10, '2025-01-15', '2026-05-21 06:58:24'),
(7, 7, 11, '2025-01-15', '2026-05-21 06:58:24'),
(8, 9, 12, '2025-01-15', '2026-05-21 06:58:24');

-- ============================================================
-- TABLE: intake_dates
-- ============================================================
CREATE TABLE `intake_dates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `intake_date` date NOT NULL,
  `label` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_intake_course_date` (`course_id`,`intake_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `intake_dates` (`id`, `course_id`, `intake_date`, `label`) VALUES
(1, 1, '2026-01-12', 'January 2026 Intake'),
(2, 1, '2026-05-04', 'May 2026 Intake'),
(3, 1, '2026-09-07', 'September 2026 Intake'),
(4, 2, '2026-01-12', 'January 2026 Intake'),
(5, 2, '2026-05-04', 'May 2026 Intake'),
(6, 2, '2026-09-07', 'September 2026 Intake'),
(7, 3, '2026-01-12', 'January 2026 Intake'),
(8, 3, '2026-09-07', 'September 2026 Intake'),
(9, 4, '2026-01-12', 'January 2026 Intake'),
(10, 4, '2026-05-04', 'May 2026 Intake'),
(11, 4, '2026-09-07', 'September 2026 Intake'),
(12, 5, '2026-01-12', 'January 2026 Intake'),
(13, 5, '2026-05-04', 'May 2026 Intake'),
(14, 6, '2026-01-12', 'January 2026 Intake'),
(15, 6, '2026-09-07', 'September 2026 Intake'),
(16, 7, '2026-01-12', 'January 2026 Intake'),
(17, 7, '2026-05-04', 'May 2026 Intake'),
(18, 8, '2026-01-12', 'January 2026 Intake'),
(19, 9, '2026-01-12', 'January 2026 Intake'),
(20, 9, '2026-05-04', 'May 2026 Intake'),
(21, 9, '2026-09-07', 'September 2026 Intake'),
(22, 10, '2026-01-12', 'January 2026 Intake'),
(23, 10, '2026-05-04', 'May 2026 Intake');

-- ============================================================
-- TABLE: materials
-- ============================================================
CREATE TABLE `materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `course_id` int(11) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_materials_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `materials` (`id`, `title`, `description`, `file_path`, `file_size`, `course_id`, `uploaded_by`, `uploaded_at`) VALUES
(1, 'Database Systems Module 1 - Introduction to SQL', 'Comprehensive introduction to SQL queries, database design, and normalization concepts.', '/uploads/2026/01/db-module1-uuid123.pdf', 2500, 1, 5, '2026-05-21 06:58:25');

-- ============================================================
-- TABLE: news_articles
-- ============================================================
CREATE TABLE `news_articles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `body` longtext NOT NULL,
  `category` enum('event','partnership','graduation','achievement','general') DEFAULT 'general',
  `image_path` varchar(255) DEFAULT NULL,
  `published_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL,
  `is_published` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_news_published` (`is_published`),
  KEY `idx_news_category` (`category`),
  KEY `idx_news_published_date` (`is_published`,`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `news_articles` (`id`, `title`, `body`, `category`, `image_path`, `published_at`, `created_by`, `is_published`) VALUES
(1, 'Kigumo TVC Achieves ISO 9001:2015 Certification', '<p>Kigumo Technical and Vocational College is proud to announce that it has been awarded the prestigious ISO 9001:2015 Quality Management System certification by the Kenya Bureau of Standards (KEBS).</p>', 'achievement', '/uploads/2026/01/iso-cert-uuid345.jpg', '2026-05-21 06:58:25', 1, 1),
(2, 'New CBET Curriculum Launched for ICT Programs', '<p>Kigumo TVC has officially launched the Competency-Based Education and Training (CBET) curriculum for all Information Communication Technology programs effective January 2026.</p>', 'event', '/uploads/2026/01/cbet-launch-uuid678.jpg', '2026-05-21 06:58:25', 2, 1);

-- ============================================================
-- TABLE: page_content
-- ============================================================
CREATE TABLE `page_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `page_key` varchar(100) NOT NULL,
  `section_key` varchar(100) NOT NULL,
  `content_html` longtext DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_page_section` (`page_key`,`section_key`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_page_key` (`page_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `page_content` (`id`, `page_key`, `section_key`, `content_html`, `updated_by`, `updated_at`) VALUES
(1, 'about', 'history', '<h3>Our History</h3><p>Kigumo Technical and Vocational College was established in 2015 by the Government of Kenya through the Ministry of Education to provide quality technical and vocational education to the youth of Kirinyaga County and the surrounding regions.</p>', 4, '2026-05-22 14:19:55'),
(2, 'about', 'charter', '<h3>Our Service Charter</h3><p>At Kigumo TVC, we are committed to providing quality technical and vocational education.</p>', 4, '2026-05-26 07:30:10'),
(3, 'about', 'vision', '<h3>Our Vision</h3><p>To be a leading center of excellence in technical and vocational education and training in Kenya.</p>', NULL, '2026-05-21 06:58:26'),
(4, 'about', 'mission', '<h3>Our Mission</h3><p>To provide quality, accessible, and relevant technical and vocational education.</p>', NULL, '2026-05-21 06:58:26'),
(5, 'about', 'core_values', '<h3>Our Core Values</h3><ul><li><strong>Excellence</strong></li><li><strong>Integrity</strong></li></ul>', NULL, '2026-05-21 06:58:26'),
(6, 'admissions', 'how_to_apply', '<h3>How to Apply</h3><p>There are two main pathways to join Kigumo Technical and Vocational College.</p>', 4, '2026-05-26 07:31:09'),
(7, 'admissions', 'requirements', '<h3>General Entry Requirements</h3><p>Diploma Programs: KCSE Mean Grade C- and above.</p>', 4, '2026-05-22 14:19:49');

-- ============================================================
-- TABLE: principal_message
-- ============================================================
CREATE TABLE `principal_message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `principal_name` varchar(100) DEFAULT NULL,
  `title` varchar(100) DEFAULT NULL,
  `message` longtext DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_principal_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `principal_message` (`id`, `principal_name`, `title`, `message`, `image_path`, `is_active`, `created_by`, `updated_at`) VALUES
(7, 'Dr. Jane Muthoni Kariuki', 'Chief Principal - Kigumo Technical Training Institute', '<p>Welcome to Kigumo Technical and Vocational College, a premier institution dedicated to empowering the youth of Kirinyaga County and beyond with practical, industry-relevant skills.</p>', 'uploads/2026/05/c9ba6d4f-82d0-4fd4-b95f-a6f9ea6c241a.jpeg', 1, 4, '2026-05-26 07:44:03');

-- ============================================================
-- TABLE: recycle_bin (TiDB compatible - no GENERATED column)
-- ============================================================
CREATE TABLE `recycle_bin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_table` varchar(100) NOT NULL,
  `original_id` int(11) NOT NULL,
  `data_snapshot` longtext NOT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `restore_deadline` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deleted_by` (`deleted_by`),
  KEY `idx_restore_deadline` (`restore_deadline`),
  KEY `idx_original_table` (`original_table`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: slider_slides
-- ============================================================
CREATE TABLE `slider_slides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `badge_text` varchar(100) DEFAULT NULL,
  `heading` varchar(200) DEFAULT NULL,
  `subtext` text DEFAULT NULL,
  `btn1_text` varchar(80) DEFAULT NULL,
  `btn1_url` varchar(255) DEFAULT NULL,
  `btn2_text` varchar(80) DEFAULT NULL,
  `btn2_url` varchar(255) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_slider_active_sort` (`is_active`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `slider_slides` (`id`, `image_path`, `badge_text`, `heading`, `subtext`, `btn1_text`, `btn1_url`, `btn2_text`, `btn2_url`, `sort_order`, `is_active`, `created_by`, `created_at`) VALUES
(1, '/uploads/2026/01/slide-graduation-uuid001.jpg', 'ISO 9001:2015 Certified', 'Build Your Future with Practical Skills', 'Join Kigumo TVC and gain industry-relevant technical skills.', 'Explore Courses', '/courses.html', 'Apply Now', '/admissions.html', 1, 1, 4, '2026-05-21 06:58:25'),
(2, '/uploads/2026/01/slide-lab-uuid002.jpg', 'CBET Curriculum', 'Competency-Based Training for Real-World Success', 'Our newly launched CBET programs ensure you learn by doing.', 'Our Programs', '/courses.html', 'Visit Us', '/contact.html', 2, 1, 4, '2026-05-21 06:58:25'),
(3, '/uploads/2026/01/slide-campus-uuid003.jpg', 'Join January 2026', 'Admissions Now Open for 2026 Intake', 'Apply for Diploma and Certificate programs.', 'How to Apply', '/admissions.html', 'Download Forms', '/downloads.html', 3, 1, 4, '2026-05-21 06:58:25');

-- ============================================================
-- TABLE: student_non_academic_memberships
-- ============================================================
CREATE TABLE `student_non_academic_memberships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `department_id` int(11) NOT NULL,
  `joined_at` date DEFAULT curdate(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_membership` (`student_id`,`department_id`),
  KEY `idx_membership_student` (`student_id`),
  KEY `idx_membership_dept` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `student_non_academic_memberships` (`id`, `student_id`, `department_id`, `joined_at`) VALUES
(1, 15, 7, '2025-01-15'),
(2, 15, 8, '2025-01-15'),
(3, 16, 8, '2025-01-15'),
(4, 17, 7, '2025-01-15'),
(5, 18, 11, '2025-01-15');

-- ============================================================
-- TABLE: timetable
-- ============================================================
CREATE TABLE `timetable` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `lecturer_id` int(11) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `day` enum('Mon','Tue','Wed','Thu','Fri') NOT NULL,
  `time_start` time NOT NULL,
  `time_end` time NOT NULL,
  `room` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_timetable_dept` (`department_id`),
  KEY `idx_timetable_lecturer` (`lecturer_id`),
  KEY `idx_timetable_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `timetable` (`id`, `department_id`, `course_id`, `lecturer_id`, `subject`, `day`, `time_start`, `time_end`, `room`) VALUES
(1, 1, 1, 5, 'Database Systems', 'Mon', '08:00:00', '10:00:00', 'ICT Lab 1'),
(2, 1, 1, 13, 'Web Development', 'Mon', '10:30:00', '12:30:00', 'ICT Lab 2'),
(3, 1, 1, 14, 'Computer Networks', 'Tue', '08:00:00', '10:00:00', 'ICT Lab 1'),
(4, 1, 3, 13, 'Java Programming', 'Tue', '10:30:00', '12:30:00', 'ICT Lab 2'),
(5, 1, 1, 5, 'System Analysis', 'Wed', '08:00:00', '10:00:00', 'Room 101'),
(6, 1, 2, 14, 'Computer Applications', 'Wed', '10:30:00', '12:30:00', 'ICT Lab 1'),
(7, 1, 3, 5, 'Mobile Development', 'Thu', '08:00:00', '10:00:00', 'ICT Lab 2'),
(8, 1, 1, 13, 'Project Management', 'Thu', '10:30:00', '12:30:00', 'Room 101'),
(9, 1, 2, 14, 'PC Maintenance', 'Fri', '08:00:00', '10:00:00', 'ICT Lab 1'),
(10, 1, 3, 13, 'Software Testing', 'Fri', '10:30:00', '12:30:00', 'ICT Lab 2');

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `reg_number` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','lecturer','hod','deputy_principal_academics','deputy_principal_administration','chief_principal','admin') NOT NULL,
  `primary_department_id` int(11) DEFAULT NULL,
  `year_of_study` int(11) DEFAULT NULL,
  `photo_path` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `reg_number` (`reg_number`),
  KEY `idx_users_role_active` (`role`,`is_active`),
  KEY `idx_users_dept` (`primary_department_id`),
  KEY `idx_users_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `full_name`, `email`, `reg_number`, `password`, `role`, `primary_department_id`, `year_of_study`, `photo_path`, `bio`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Dr. Jane Muthoni Kariuki', 'principal@kigumotvc.ac.ke', 'ADMIN/2501/1001', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'chief_principal', 1, NULL, NULL, 'Dr. Jane Muthoni Kariuki is the Chief Principal of Kigumo Technical and Vocational College.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(2, 'Prof. Peter Mwangi Kamau', 'dp.academics@kigumotvc.ac.ke', 'ADMIN/2501/1002', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'deputy_principal_academics', 1, NULL, NULL, 'Prof. Peter Mwangi Kamau serves as the Deputy Principal in charge of Academic Affairs.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(3, 'Mrs. Catherine Wanjiku Ndung''u', 'dp.administration@kigumotvc.ac.ke', 'ADMIN/2501/1003', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'deputy_principal_administration', 1, NULL, NULL, 'Mrs. Catherine Wanjiku Ndung''u is the Deputy Principal in charge of Administration and Finance.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(4, 'Mr. David Otieno Okello', 'admin@kigumotvc.ac.ke', 'ADMIN/2501/1004', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'admin', 1, NULL, NULL, NULL, 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(5, 'Mr. James Njenga Mwangi', 'james.njenga@kigumotvc.ac.ke', 'LECT/2501/2001', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 1, NULL, NULL, 'Mr. James Njenga is the Head of ICT Department with 10 years of teaching experience.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(6, 'Mrs. Elizabeth Wambui Maina', 'elizabeth.maina@kigumotvc.ac.ke', 'LECT/2501/2002', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 2, NULL, NULL, 'Mrs. Elizabeth Maina is the Head of Business Studies Department.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(7, 'Eng. Patrick Kiprono Rotich', 'patrick.rotich@kigumotvc.ac.ke', 'LECT/2501/2003', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 3, NULL, NULL, 'Eng. Patrick Rotich is the Head of Engineering Department.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(8, 'Mrs. Rose Akinyi Ochieng', 'rose.akinyi@kigumotvc.ac.ke', 'LECT/2501/2004', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 4, NULL, NULL, 'Mrs. Rose Akinyi is the Head of Hospitality Department.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(9, 'Dr. Michael Barasa Wekesa', 'michael.wekesa@kigumotvc.ac.ke', 'LECT/2501/2005', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 5, NULL, NULL, 'Dr. Michael Wekesa is the Head of Applied Sciences Department.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(10, 'Mrs. Agnes Mueni Mutua', 'agnes.mueni@kigumotvc.ac.ke', 'LECT/2501/2006', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 6, NULL, NULL, 'Mrs. Agnes Mutua is the Head of Social Work Department.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(11, 'Mr. Tom Odhiambo Onyango', 'tom.odhiambo@kigumotvc.ac.ke', 'LECT/2501/2007', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 7, NULL, NULL, 'Mr. Tom Odhiambo is the Sports Director at Kigumo TVC.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(12, 'Mrs. Nancy Wairimu Kamande', 'nancy.wairimu@kigumotvc.ac.ke', 'LECT/2501/2008', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'hod', 9, NULL, NULL, 'Mrs. Nancy Wairimu is the Head of Catering and Accommodation.', 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(13, 'Mr. Paul Mutua Kioko', 'paul.mutua@kigumotvc.ac.ke', 'LECT/2501/2009', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'lecturer', 1, NULL, NULL, NULL, 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(14, 'Ms. Diana Chelagat Kosgei', 'diana.chelagat@kigumotvc.ac.ke', 'LECT/2501/2010', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'lecturer', 1, NULL, NULL, NULL, 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(15, 'Mr. Stephen Maingi Muthoka', 'stephen.maingi@kigumotvc.ac.ke', 'LECT/2501/2011', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'lecturer', 2, NULL, NULL, NULL, 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(16, 'Mrs. Lucy Nyambura Karanja', 'lucy.nyambura@kigumotvc.ac.ke', 'LECT/2501/2012', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'lecturer', 2, NULL, NULL, NULL, 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(17, 'Eng. Bernard Kiplagat Rono', 'bernard.kiplagat@kigumotvc.ac.ke', 'LECT/2501/2013', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'lecturer', 3, NULL, NULL, NULL, 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(18, 'Mrs. Grace Kaari Muriithi', 'grace.kaari@kigumotvc.ac.ke', 'LECT/2501/2014', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'lecturer', 4, NULL, NULL, NULL, 1, '2026-05-21 06:58:23', '2026-05-22 13:42:26'),
(19, 'Brian Kipchirchir Kosgei', 'brian.kosgei@student.kigumotvc.ac.ke', 'DICT/2501/1712', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 1, 1, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(20, 'Mercy Wangui Mwangi', 'mercy.wangui@student.kigumotvc.ac.ke', 'DICT/2501/1713', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 1, 1, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(21, 'Kevin Omondi Achieng', 'kevin.omondi@student.kigumotvc.ac.ke', 'DICT/2501/1714', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 1, 2, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(22, 'Faith Nduku Mutiso', 'faith.nduku@student.kigumotvc.ac.ke', 'DICT/2501/1715', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 1, 2, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(23, 'Joseph Mwenda Miriti', 'joseph.mwenda@student.kigumotvc.ac.ke', 'BUS/2501/1801', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 2, 1, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(24, 'Ann Wanjiru Karimi', 'ann.wanjiru@student.kigumotvc.ac.ke', 'BUS/2501/1802', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 2, 1, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(25, 'Peter Muia Nguli', 'peter.muia@student.kigumotvc.ac.ke', 'BUS/2501/1803', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 2, 3, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(26, 'Susan Kaithi Muthoni', 'susan.kaithi@student.kigumotvc.ac.ke', 'HOSP/2501/1901', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 4, 1, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(27, 'Daniel Mutuku Mwololo', 'daniel.mutuku@student.kigumotvc.ac.ke', 'ENG/2501/2001', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 3, 2, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26'),
(28, 'Sarah Nasimiyu Wafula', 'sarah.nasimiyu@student.kigumotvc.ac.ke', 'SCI/2501/2101', '$2b$12$5/em9vHcEVVHsawr4rJIQubkXQRSoaTWq/MagEg/lo8/DV70KZx4G', 'student', 5, 1, NULL, NULL, 1, '2026-05-21 06:58:24', '2026-05-22 13:42:26');

-- ============================================================
-- SET AUTO_INCREMENT VALUES
-- ============================================================
ALTER TABLE announcements AUTO_INCREMENT = 4;
ALTER TABLE bom_members AUTO_INCREMENT = 9;
ALTER TABLE contact_enquiries AUTO_INCREMENT = 3;
ALTER TABLE courses AUTO_INCREMENT = 11;
ALTER TABLE departments AUTO_INCREMENT = 12;
ALTER TABLE downloads AUTO_INCREMENT = 9;
ALTER TABLE fees AUTO_INCREMENT = 26;
ALTER TABLE gallery_albums AUTO_INCREMENT = 4;
ALTER TABLE gallery_photos AUTO_INCREMENT = 1;
ALTER TABLE hod_assignments AUTO_INCREMENT = 9;
ALTER TABLE intake_dates AUTO_INCREMENT = 24;
ALTER TABLE materials AUTO_INCREMENT = 6;
ALTER TABLE news_articles AUTO_INCREMENT = 3;
ALTER TABLE page_content AUTO_INCREMENT = 13;
ALTER TABLE principal_message AUTO_INCREMENT = 8;
ALTER TABLE recycle_bin AUTO_INCREMENT = 12;
ALTER TABLE slider_slides AUTO_INCREMENT = 4;
ALTER TABLE student_non_academic_memberships AUTO_INCREMENT = 6;
ALTER TABLE timetable AUTO_INCREMENT = 11;
ALTER TABLE users AUTO_INCREMENT = 32;

