-- Migration 003: Standardise course levels and module counts
-- Level mapping:
--   Diploma        (Level 6) → module_count = 6, duration_years = 3
--   Certificate    (Level 5) → module_count = 4, duration_years = 2
--   Craft Cert     (Level 4) → module_count = 2, duration_years = 1
--   Artisan        (Level 3) → module_count = 1, duration_years = 0 (6 months stored as 0)
--   Short Courses  (Internal)→ module_count = 0, duration_years = 0

-- 1. Ensure module_count column exists (no-op if already present)
ALTER TABLE courses MODIFY COLUMN `module_count` int NOT NULL DEFAULT 6;

-- 2. Fix all existing courses based on the level encoded in their name
--    Rows whose names contain "Level 6" or "Diploma" (and not overridden)
UPDATE courses SET module_count = 6, duration_years = 3
WHERE (name LIKE '%Level 6%' OR name LIKE '%Diploma%')
  AND examining_body != 'Internal';

-- 3. Certificate / Level 5
UPDATE courses SET module_count = 4, duration_years = 2
WHERE (name LIKE '%Level 5%' OR name LIKE '%Certificate%')
  AND name NOT LIKE '%Craft%'
  AND examining_body != 'Internal';

-- 4. Craft Certificate / Level 4
UPDATE courses SET module_count = 2, duration_years = 1
WHERE (name LIKE '%Level 4%' OR name LIKE '%Craft%')
  AND examining_body != 'Internal';

-- 5. Artisan / Level 3
UPDATE courses SET module_count = 1, duration_years = 0
WHERE (name LIKE '%Level 3%' OR name LIKE '%Artisan%')
  AND examining_body != 'Internal';

-- 6. Short / Internal courses
UPDATE courses SET module_count = 0, duration_years = 0
WHERE examining_body = 'Internal';
