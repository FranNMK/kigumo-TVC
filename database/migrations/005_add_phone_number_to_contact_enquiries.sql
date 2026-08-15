-- Migration 005: Add phone_number column to contact_enquiries
-- Run this against your kigumo_tvc database.

ALTER TABLE `contact_enquiries`
  ADD COLUMN `phone_number` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL
  AFTER `email`;
