# DATABASE.md — Kigumo TVC

## Engine & Connection

TiDB Cloud Serverless (MySQL 8.0 protocol). Accessed via `mysql2/promise` pool in `server/db.js`. Default port: 4000. Pool size: 10 connections. SSL optional (see `ENV_AND_CONFIG.md`).

> All schemas in this document are verified against the live dump in `database/updated/`. The older files in `database/` (without the `updated/` subfolder) are superseded by the dump and should not be used for a fresh setup.

---

## Setup from Scratch

1. **Create the database**
   ```sql
   -- Run: database/updated/kigumo_tvc-schema-create.sql
   CREATE DATABASE `kigumo_tvc` DEFAULT CHARACTER SET utf8mb4;
   ```

2. **Create all tables** — run every `*-schema.sql` file from `database/updated/` in the order below (FK dependencies exist — order matters):

   ```
   # No dependencies
   departments
   innovation_events
   download_categories

   # Depend on departments
   courses
   hod_assignments
   cohort_batches
   innovation_users
   innovation_skills_categories
   innovation_participants           ← also depends on innovation_events
   student_non_academic_memberships

   # Depend on users / participants / events
   users                             ← no FK to departments in schema, but create after departments
   intake_settings                   ← FK updated_by → users ON DELETE SET NULL
   materials                         ← no FK constraint in schema (only indexed)
   material_cohorts                  ← FK → materials ON DELETE CASCADE
   innovation_scores                 ← FK → participants, events, categories, innovation_users
   innovation_projects               ← FK → events, participants ON DELETE CASCADE
   applications                      ← FK → departments, courses

   # No upstream dependencies
   announcements
   bom_members
   contact_enquiries
   fees
   gallery_albums
   gallery_photos
   intake_dates
   intake_dates_global
   news_articles
   page_content
   partners
   portals
   principal_message
   recycle_bin
   slider_slides
   timetable
   downloads
   ```

   All schema files begin with `SET FOREIGN_KEY_CHECKS=0`, so strict ordering is only required for databases that enforce checks during import.

3. **Seed reference data** — run each `*.0000000010000.sql` seed file from `database/updated/`.

4. **Sessions table** — the live `sessions` schema is now in `database/updated/kigumo_tvc.sessions-schema.sql`. It can also be auto-created by `express-mysql-session` on first app startup. No manual action needed if the app has run before.

5. **Migrations are already reflected in the live dump** — `intake_dates_global` is a first-class table in `database/updated/` (not only in `migrations/`). Migration `001` (`resource_type` column) is already present in the `materials` schema in `database/updated/`. If setting up from the `updated/` dump, **do not re-apply the migrations** — they are already baked in.

---

## Complete Table Reference

### Users & Auth

| Table | Key columns | Notes |
|---|---|---|
| `users` | `id`, `full_name`, `email` (UNIQUE), `reg_number` (UNIQUE), `password`, `role` (enum — 10 values), `primary_department_id`, `year_of_study`, `photo_path`, `bio`, `is_active` | Password is bcrypt hash of user's phone number. Roles: `student`, `lecturer`, `hod`, `deputy_principal_academics`, `deputy_principal_administration`, `chief_principal`, `admin`, `registrar`, `secretary`, `dean_of_students`. No FK from `primary_department_id` to `departments` in schema |
| `hod_assignments` | `id`, `department_id` (UNIQUE), `lecturer_id`, `assigned_at` | UNIQUE on `department_id` enforces one HOD per department. No FK to `users` in schema — only indexed. FK logic handled in `admin.js` route code |
| `sessions` | `session_id` (PK), `expires`, `data` | Auto-created by `express-mysql-session` on first startup. Schema file now in `database/updated/` |

### Academic

| Table | Key columns | Notes |
|---|---|---|
| `departments` | `id`, `name`, `type` (`academic`/`non_academic`), `description`, `image_path`, `vision`, `mission`, `objective` | `image_path` is a Cloudinary URL |
| `courses` | `id`, `name`, `department_id`, `duration_years`, `module_count`, `examining_body` (KNEC/KASNEB/CDACC/Internal), `cbet_status`, `entry_requirements`, `is_active` | No FK constraint on `department_id` in schema — only indexed |
| `fees` | `id`, `course_id`, `year_of_study`, `tuition`, `examination`, `registration`, `id_card`, `other`, `other_label` | One row per course per year of study. No FK constraint in schema |
| `intake_dates` | `id`, `course_id`, `intake_date`, `label` | Per-course intake dates. No FK constraint in schema |
| `intake_dates_global` | `id`, `label`, `intake_date`, `application_deadline`, `programs_available`, `status` (`open`/`upcoming`/`closed`) | Public-facing admissions page. Not linked to courses. Previously created by migration 002; now a first-class table in the live dump |
| `intake_settings` | `id`, `jan_close_day`, `may_close_day`, `sep_close_day`, `updated_by` (FK → `users` ON DELETE SET NULL) | Single-row configuration for admission deadline-day offsets |
| `cohort_batches` | `id`, `department_id` (FK → `departments`), `batch_code` (4 chars), `intake_date`, `label`, `is_active` | UNIQUE on `(department_id, batch_code)` |
| `timetable` | `id`, `department_id`, `course_id`, `lecturer_id`, `subject`, `day` (Mon–Fri), `time_start`, `time_end`, `room` | No FK constraints in schema — columns are indexed only |
| `materials` | `id`, `title`, `file_path`, `file_size`, `original_filename`, `course_id`, `uploaded_by`, `public_id`, `resource_type` (DEFAULT `'raw'`) | `file_path` currently stores `/uploads/<filename>` (local disk). `public_id` and `resource_type` unused for new uploads. `resource_type` added by migration 001 (already in live schema) |
| `material_cohorts` | `id`, `material_id` (FK → `materials` ON DELETE CASCADE), `admission_prefix` | UNIQUE on `(material_id, admission_prefix)`. Controls which student cohort can access a material |

### Content

| Table | Key columns | Notes |
|---|---|---|
| `slider_slides` | `id`, `image_path`, `media_type` (DEFAULT `'image'`), `badge_text`, `heading`, `subtext`, `btn1_text`, `btn1_url`, `btn2_text`, `btn2_url`, `sort_order`, `is_active`, `created_by` | Cloudinary URL |
| `news_articles` | `id`, `title`, `body`, `category`, `image_path`, `is_published`, `created_by` | Cloudinary URL |
| `bom_members` | `id`, `full_name`, `position`, `photo_path`, `sort_order`, `is_active` | Cloudinary URL |
| `page_content` | `id`, `page_key`, `section_key`, `content` | Editable text sections for public pages |
| `principal_message` | `id`, `principal_name`, `title`, `message`, `photo_path`, `is_active` | Cloudinary URL |
| `partners` | `id`, `name`, `logo_path`, `website_url`, `is_active` | Cloudinary URL |
| `portals` | `id`, `name`, `description`, `url`, `icon`, `is_active` | External link listing |
| `downloads` | `id`, `title`, `category`, `file_path`, `file_size`, `original_filename`, `uploaded_by` | Local disk path (`/uploads/...`). `category` references `download_categories.name` (no FK constraint) |
| `download_categories` | `id`, `name`, `display_name` | Lookup table for download categories |

### Student Data

| Table | Key columns | Notes |
|---|---|---|
| `student_non_academic_memberships` | `id`, `student_id`, `department_id`, `joined_at` | UNIQUE on `(student_id, department_id)`. No FK constraints in schema |
| `gallery_albums` | `id`, `title`, `event_date`, `created_by` | Schema exists and in live DB. **No API routes implemented** |
| `gallery_photos` | `id`, `album_id`, `file_path`, `caption` | Schema exists and in live DB. **No API routes implemented**. No FK constraint on `album_id` in schema |

### Operations

| Table | Key columns | Notes |
|---|---|---|
| `announcements` | `id`, `title`, `body`, `scope` (`college_wide`/`department`), `department_id`, `posted_by` | — |
| `applications` | `id`, `reference_number` (UNIQUE), `full_name`, `dob`, `gender`, `id_number`, `phone`, `email`, `department_id` (FK → `departments`), `course_id` (FK → `courses`), `kcse_cert_path`, `id_doc_path`, `photo_path`, `status` (`pending`/`reviewed`/`accepted`/`rejected`) | Document paths are Cloudinary URLs |
| `contact_enquiries` | `id`, `name`, `email`, `phone`, `subject`, `message` | — |
| `recycle_bin` | `id`, `original_table`, `original_id`, `data_snapshot` (LONGTEXT JSON), `deleted_by`, `deleted_at`, `restore_deadline` | Soft-delete store for all major content. Auto-cleaned every 24h by `setInterval` in `server/index.js` |
| `sessions` | `session_id` (PK), `expires`, `data` | Managed by `express-mysql-session` |

### Innovation Portal

All five tables are confirmed in the live dump at `database/updated/`. They share the same `kigumo_tvc` database.

| Table | Key columns | Notes |
|---|---|---|
| `innovation_users` | `id`, `full_name`, `email` (UNIQUE), `phone`, `password_hash`, `role` (`admin`/`coordinator`), `department_id` (FK → `departments` ON DELETE SET NULL), `is_active`, `must_change_password` | Separate from the main `users` table. Uses `password_hash` column name (not `password`). Independent login session via `req.session.innovationUser` |
| `innovation_events` | `id`, `name`, `description`, `event_type` (`skills_competition`/`innovation_exhibition`/`research_project`), `start_date`, `end_date`, `status` (`draft`/`active`/`archived`) | — |
| `innovation_participants` | `id`, `event_id` (FK → `innovation_events` ON DELETE CASCADE), `admission_number`, `full_name`, `department_id` (FK → `departments`) | UNIQUE on `(event_id, admission_number)` |
| `innovation_skills_categories` | `id`, `department_id` (FK → `departments`), `name`, `description`, `is_active` | UNIQUE on `(department_id, name)`. Used as scoring dimensions |
| `innovation_scores` | `id`, `participant_id` (FK → `innovation_participants` ON DELETE CASCADE), `event_id` (FK → `innovation_events`), `category_id` (FK → `innovation_skills_categories`), `coordinator_id` (FK → `innovation_users`), `score` DECIMAL(5,2), `remarks` | UNIQUE on `(participant_id, category_id, event_id)` — one score per participant per category per event |
| `innovation_projects` | `id`, `event_id` (FK → `innovation_events` ON DELETE CASCADE), `participant_id` (FK → `innovation_participants` ON DELETE CASCADE), `title`, `description`, `document_path`, `status` (`submitted`/`under_review`/`approved`/`rejected`) | **No API routes implemented**. Table exists in live DB but the innovation route files do not reference it |

---

## Key Relationships

```
departments ──< courses ──< fees
            ──< cohort_batches
            ──< hod_assignments >── users
            ──< innovation_users
            ──< innovation_skills_categories
            ──< innovation_participants >── innovation_events
                     ──< innovation_scores >── innovation_skills_categories
                     │                     └── innovation_users (coordinator)
                     └── innovation_projects >── innovation_events

applications >── departments
             └── courses

materials ──< material_cohorts
gallery_albums ──< gallery_photos
intake_settings.updated_by → users
student_non_academic_memberships: student_id + department_id (no FK constraints)
```

---

## Migrations

Both migrations are already applied in the live dump. Do not re-apply them when setting up from `database/updated/`.

| File | What it does | Already in live dump |
|---|---|---|
| `migrations/001_add_materials_resource_type.sql` | Adds `resource_type VARCHAR(20) DEFAULT 'raw'` to `materials` | ✅ Yes |
| `migrations/002_create_intake_dates_global.sql` | Creates `intake_dates_global`; seeds 3 rows for 2026 intakes | ✅ Yes |
