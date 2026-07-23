-- Migration 001: Add resource_type column to materials table
-- Run this once against the live TiDB database.
-- Safe to run multiple times (uses IF NOT EXISTS pattern via IGNORE).
--
-- Why: materials uploaded before this migration will have resource_type = NULL.
-- The application falls back to 'raw' for NULL, which is correct for PDF/DOCX files.
-- Image materials uploaded before this migration will also show NULL → 'raw' fallback,
-- which will produce a /raw/upload/ URL for those images. Re-upload any affected image
-- materials to store the correct 'image' resource_type going forward.

ALTER TABLE `materials`
  ADD COLUMN IF NOT EXISTS `resource_type` varchar(20)
    COLLATE utf8mb4_general_ci
    DEFAULT 'raw'
    COMMENT 'Cloudinary resource_type: image or raw'
    AFTER `public_id`;
