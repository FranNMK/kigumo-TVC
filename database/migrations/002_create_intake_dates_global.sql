-- Migration: 002_create_intake_dates_global
-- Creates a standalone table for the public-facing intake dates shown on the
-- Admissions page and managed from the Admin panel.
-- This is separate from intake_dates (which is course-specific) and
-- intake_settings (which stores deadline-day offsets).

CREATE TABLE IF NOT EXISTS `intake_dates_global` (
  `id`                    int NOT NULL AUTO_INCREMENT,
  `label`                 varchar(150) NOT NULL COMMENT 'e.g. January 2026',
  `intake_date`           date NOT NULL COMMENT 'Reporting / start date',
  `application_deadline`  date NOT NULL COMMENT 'Last day to apply',
  `programs_available`    varchar(255) NOT NULL DEFAULT 'All Diploma & Certificate',
  `status`                enum('open','upcoming','closed') NOT NULL DEFAULT 'upcoming',
  `created_at`            timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_intake_year` (`intake_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed with the three 2026 intakes already on the admissions page
INSERT IGNORE INTO `intake_dates_global`
  (`id`, `label`, `intake_date`, `application_deadline`, `programs_available`, `status`)
VALUES
  (1, 'January 2026',   '2026-01-12', '2025-12-31', 'All Diploma & Certificate', 'open'),
  (2, 'May 2026',       '2026-05-04', '2026-04-30', 'Certificate & Artisan',     'upcoming'),
  (3, 'September 2026', '2026-09-07', '2026-08-31', 'All Diploma & Certificate', 'upcoming');
