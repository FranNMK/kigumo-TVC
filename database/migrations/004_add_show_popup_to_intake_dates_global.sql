-- Migration: 004_add_show_popup_to_intake_dates_global
-- Adds a show_popup flag so admins can control whether an intake date
-- triggers the first-visit announcement popup on the public website.

ALTER TABLE `intake_dates_global`
  ADD COLUMN `show_popup` tinyint(1) NOT NULL DEFAULT 0
    COMMENT '1 = show announcement popup to first-time visitors for this intake'
  AFTER `status`;
