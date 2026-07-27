# API_REFERENCE.md — Kigumo TVC

Base URL: `https://kigumotvc.ac.ke/api/v1`

All authenticated routes require a valid session cookie (`connect.sid`) obtained from `POST /auth/login`. The session expires after 30 minutes of inactivity.

Response envelope for main portal routes: `{ success: true|false, data: ... }` or `{ success: false, message: "..." }`.
Innovation portal routes return bare objects/arrays without the `success` envelope.

---

## Auth (`/auth`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/login` | None (rate-limited: 5/15 min per IP) | Login with `{ identifier, password }`. Returns session cookie + `{ role, redirectUrl, user }`. `identifier` is `reg_number` for students, `email` for staff |
| `POST` | `/auth/logout` | None required (no error if not logged in) | Destroys current session and clears cookie |
| `GET` | `/auth/me` | Any authenticated session | Returns current session user object. Used by frontend to verify session after page refresh |

---

## Courses (`/courses`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/courses` | Public | All active courses with department info, fees per year of study, and next intake date. Optional query param: `?department_id=<n>` |
| `GET` | `/courses/:id` | Public | Single course with full details, all fees, and all future intake dates |

---

## Departments (`/departments`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/departments` | Public | All departments with HOD name and photo. Optional query param: `?type=academic\|non_academic` |
| `GET` | `/departments/with-courses` | Public | All departments with nested array of their active courses |
| `GET` | `/departments/:id` | Public | Single department with HOD profile and course list |
| `GET` | `/departments/:id/courses` | Public | Active courses for a specific department |

---

## Timetable (`/timetable`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/timetable/my` | Any authenticated session | Students get their department timetable. Lecturers/HODs get their own teaching slots. Other roles receive 403 |

---

## Materials (`/materials`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/materials/my` | Any authenticated session | Students get materials assigned to their cohort prefix. Lecturers/HODs get materials they uploaded |
| `GET` | `/materials/cohorts` | `lecturer` or `hod` | Cohort batches for the authenticated user's department (for the upload form) |
| `GET` | `/materials/download/:id` | Any authenticated session | Redirects (302) to `/uploads/<filename>` for the requested material. Students may only download materials assigned to their cohort; lecturers only their own uploads |
| `POST` | `/materials/upload` | `lecturer` or `hod` | Upload a course material. `multipart/form-data`: `file` (required), `title` (required), `description`, `course_id`, `admission_prefixes` (JSON array or comma-separated string) |
| `PUT` | `/materials/:id` | `lecturer` or `hod` | Edit title/description of own material. Body: `{ title, description }` |
| `DELETE` | `/materials/:id` | `lecturer` or `hod` | Delete own material. Removes file from disk and DB row |

---

## Announcements (`/announcements`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/announcements/my` | Any authenticated session | College-wide announcements plus department-scoped ones matching the user's department. Returns last 50, newest first |
| `POST` | `/announcements` | `lecturer` or `hod` | Post an announcement. Body: `{ title, body, scope: "college_wide"\|"department", department_id? }` |

---

## Users (`/users`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/users` | Public | Active users. Optional query param: `?role=<role>`. Returns `id, full_name, email, reg_number, role, primary_department_id, photo_path, bio` — no passwords |
| `GET` | `/users/department/:id` | `hod` | Students in the HOD's own department only. Returns 403 if the department ID doesn't match the HOD's own |
| `POST` | `/users/add-student` | `hod` | Add a student to own department. Body: `{ full_name, reg_number, phone, year_of_study, department_id, email? }`. `reg_number` must match pattern `LETTERS/4DIGITS/DIGITS` |

---

## Management (`/management`)

All routes require authentication + one of: `chief_principal`, `deputy_principal_academics`, `deputy_principal_administration`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/management/overview` | Management roles | Totals: active students, active lecturers/HODs, active courses, all departments |
| `GET` | `/management/departments` | Management roles | Academic departments with HOD name, material count, and student count |

---

## News (`/news`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/news` | Public | Published articles. Query params: `?page=<n>&limit=<n>&category=<event\|partnership\|graduation\|achievement\|general>`. Default: page 1, limit 10 (max 50) |
| `GET` | `/news/:id` | Public | Single published article |

---

## Downloads (`/downloads`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/downloads` | Public | All downloads with `id, title, category, file_path, file_size, original_filename, uploaded_at` |
| `GET` | `/downloads/download/:id` | Public | Redirects (302) to `/uploads/<filename>` for file download |
| `GET` | `/downloads/download-categories` | Public | Download category names and display names |

---

## Statistics (`/stats`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/stats` | Public | Totals: students, courses, academic departments, lecturers, `yearsSinceEstablishment` (computed as current year minus 2023) |

---

## Slides (`/slides`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/slides` | Public | All active homepage slider slides, ordered by `sort_order` |

---

## Partners (`/partners`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/partners` | Public | All active partners: `id, name, logo_path, website_url` |

---

## Board of Management (`/bom`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/bom` | Public | Active BOM members: `id, full_name, position, photo_path, sort_order` |

---

## Content (`/content`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/content/principal-message` | Public | The current active principal message (name, title, message, photo) |
| `GET` | `/content/:pageKey/:sectionKey` | Public | A specific editable page section by page key and section key |

---

## Portals (`/portals`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/portals` | Public | Active external portals: `id, name, description, link, icon` |

---

## Contact (`/contact`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/contact` | Public | Submit a contact enquiry. Body: `{ full_name, email, subject, message }` — all required |

---

## Applications (`/applications`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/applications` | Public | Submit an online application. `multipart/form-data`. Required fields: `full_name, dob, gender, id_number, phone, email, kcse_year, kcse_grade, department_id, course_id, preferred_intake, study_mode`, file `kcse_cert`, file `id_doc`. Optional files: `photo`, `kcpe_cert`, `leaving_cert`. Returns `{ reference_number, applicant_name, course_name }` |

---

## Health Check

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/ping` | Public | Server liveness check. Returns `{ success: true, timestamp, environment }` |

---

## Admin (`/admin`)

All routes require authentication + `admin` role. The router applies `isAuthenticated` + `hasRole('admin')` globally at line 10–11 of `server/routes/admin.js`, **except** the one public route below which is mounted directly on `app` in `server/index.js` before the admin router.

### Intake Dates (public exception)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/intake-dates/public` | **Public** (registered before admin router) | Future global intake dates for the admissions page |

### Users
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/users` | Admin | All users with optional filters (`?role=`, `?department_id=`, `?search=`) |
| `GET` | `/admin/users/:id` | Admin | Single user full detail |
| `POST` | `/admin/users` | Admin | Create user. `multipart/form-data`. Required: `full_name, phone, role`. Optional: `email, reg_number, department_id, year_of_study, bio`, file `photo` |
| `PUT` | `/admin/users/:id` | Admin | Update user. Same fields as POST, all optional. Syncs HOD assignment if role changes |
| `PATCH` | `/admin/users/:id/deactivate` | Admin | Toggle `is_active` |
| `PATCH` | `/admin/users/:id/password` | Admin | Reset password. Body: `{ new_password }` |
| `DELETE` | `/admin/users/:id` | Admin | Move user to recycle bin |

### Departments
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/departments` | Admin | All departments |
| `POST` | `/admin/departments` | Admin | Create department. `multipart/form-data`. Required: `name, type`. Optional: `description, vision, mission, objective`, file `image` |
| `PUT` | `/admin/departments/:id` | Admin | Update department |
| `DELETE` | `/admin/departments/:id` | Admin | Delete department |
| `PUT` | `/admin/departments/:id/hod` | Admin | Assign HOD. Body: `{ lecturer_id, assigned_at? }`. Replaces existing HOD; updates user role to `hod` |

### Courses
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/admin/courses` | Admin | Create course with fees and intake dates |
| `PUT` | `/admin/courses/:id` | Admin | Update course |
| `PATCH` | `/admin/courses/:id/toggle` | Admin | Toggle `is_active` |
| `DELETE` | `/admin/courses/:id` | Admin | Delete course |

### Cohorts
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/cohorts` | Admin | All cohorts. Optional `?department_id=<n>` |
| `POST` | `/admin/cohorts` | Admin | Create cohort. Body: `{ department_id, batch_code, intake_date, label? }` |
| `PATCH` | `/admin/cohorts/:id/toggle` | Admin | Toggle `is_active` |

### Slides
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/slides` | Admin | All slides |
| `POST` | `/admin/slides` | Admin | Create slide. `multipart/form-data`. Optional file `media` (image or video) |
| `PUT` | `/admin/slides/:id` | Admin | Update slide |
| `PATCH` | `/admin/slides/:id/toggle` | Admin | Toggle `is_active` |
| `DELETE` | `/admin/slides/:id` | Admin | Move to recycle bin |

### News
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/news` | Admin | All articles (published and unpublished) |
| `GET` | `/admin/news/:id` | Admin | Single article |
| `POST` | `/admin/news` | Admin | Create article. `multipart/form-data`. Required: `title, body`. Optional: `category`, file `image`. Published immediately |
| `PUT` | `/admin/news/:id` | Admin | Update article. Archives old version to recycle bin |
| `PATCH` | `/admin/news/:id/toggle` | Admin | Toggle `is_published` |
| `DELETE` | `/admin/news/:id` | Admin | Move to recycle bin |

### Partners
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/partners` | Admin | All partners |
| `POST` | `/admin/partners` | Admin | Create partner. `multipart/form-data`. Required: `name`. Optional: `website_url, sort_order`, file `logo` |
| `PUT` | `/admin/partners/:id` | Admin | Update partner |
| `PATCH` | `/admin/partners/:id/toggle` | Admin | Toggle `is_active` |
| `DELETE` | `/admin/partners/:id` | Admin | Delete partner |

### Board of Management
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/bom` | Admin | All BOM members |
| `POST` | `/admin/bom` | Admin | Create member. `multipart/form-data`. Required: `full_name`. Optional: `position, sort_order`, file `photo` |
| `PUT` | `/admin/bom/:id` | Admin | Update member |
| `PATCH` | `/admin/bom/:id/toggle` | Admin | Toggle `is_active` |
| `DELETE` | `/admin/bom/:id` | Admin | Delete member |

### Downloads (Admin)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/downloads` | Admin | All downloads |
| `POST` | `/admin/downloads` | Admin | Upload download file to disk. `multipart/form-data`. Required: `title, category`, file `file` |
| `PUT` | `/admin/downloads/:id` | Admin | Update download (optionally replace file) |
| `DELETE` | `/admin/downloads/:id` | Admin | Move to recycle bin |
| `GET` | `/admin/download-categories` | Admin | All categories with file count |
| `POST` | `/admin/download-categories` | Admin | Create category. Body: `{ name, display_name }` |
| `PUT` | `/admin/download-categories/:name` | Admin | Rename category |
| `DELETE` | `/admin/download-categories/:name` | Admin | Delete category |

### Page Content & Principal Message
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/page-content` | Admin | All page content sections |
| `PUT` | `/admin/page-content/:pageKey/:sectionKey` | Admin | Update a specific content section. Body: `{ content_html }` |
| `PUT` | `/admin/principal-message` | Admin | Update principal message. `multipart/form-data`. Fields: `principal_name, title, message`. Optional file `photo` |

### Portals (Admin)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/portals` | Admin | All portals (including inactive) |
| `POST` | `/admin/portals` | Admin | Create portal. Body: `{ name, link, description?, icon?, sort_order? }` |
| `PUT` | `/admin/portals/:id` | Admin | Update portal |
| `DELETE` | `/admin/portals/:id` | Admin | Delete portal permanently |

### Applications (Admin)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/applications` | Admin | All applications. Optional: `?status=pending\|reviewed\|accepted\|rejected`, `?search=<text>` |
| `GET` | `/admin/applications/:id` | Admin | Single application with course and department names |
| `PATCH` | `/admin/applications/:id/status` | Admin | Update status. Body: `{ status }` |
| `DELETE` | `/admin/applications/:id` | Admin | Move to recycle bin (1-day restore window) |
| `POST` | `/admin/applications/bulk-delete` | Admin | Bulk delete by IDs. Body: `{ ids: [1,2,3] }` |

### Enquiries
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/enquiries` | Admin | All contact form submissions |
| `PATCH` | `/admin/enquiries/:id/read` | Admin | Mark enquiry as read |

### Timetable (Admin)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/timetable/all` | Admin | All timetable entries across all departments |

### Recycle Bin
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/recycle-bin` | Admin | All items in recycle bin |
| `POST` | `/admin/recycle-bin/:id/restore` | Admin | Restore an item to its original table |
| `DELETE` | `/admin/recycle-bin/:id` | Admin | Permanently delete one item |
| `POST` | `/admin/recycle-bin/bulk-delete` | Admin | Permanently delete multiple items. Body: `{ ids: [1,2,3] }` |
| `DELETE` | `/admin/recycle-bin` | Admin | Empty the entire recycle bin |

### Intake Dates & Settings (Admin)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/admin/intake-dates` | Admin | All global intake dates. Optional `?year=<n>` |
| `POST` | `/admin/intake-dates` | Admin | Create intake date. Body: `{ label, intake_date, application_deadline, programs_available?, status? }` |
| `PUT` | `/admin/intake-dates/:id` | Admin | Update intake date |
| `DELETE` | `/admin/intake-dates/:id` | Admin | Delete intake date |
| `GET` | `/admin/intake-settings` | Admin | Deadline day offsets (jan/may/sep close day) |
| `PUT` | `/admin/intake-settings` | Admin | Update offsets. Body: `{ jan_close_day, may_close_day, sep_close_day }` |

---

## Innovation Portal (`/innovation`)

Innovation portal routes use `req.session.innovationUser` (set by innovation login), not the main portal session.

### Innovation Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/innovation/auth/login` | None | Login with `{ email, password }`. Sets `innovationUser` on session. Returns `{ success, user, redirectUrl }` |
| `POST` | `/innovation/auth/logout` | None required | Removes `innovationUser` from session only (does not destroy the session, so main portal login survives) |
| `GET` | `/innovation/auth/me` | Innovation session | Returns current innovation session user |

### Innovation Events
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/innovation/events` | Public | All events ordered by start date |
| `GET` | `/innovation/events/:id` | Public | Single event |
| `POST` | `/innovation/events` | Innovation admin | Create event. Body: `{ name, event_type, start_date, end_date, description?, status? }`. `event_type` must be `skills_competition\|innovation_exhibition\|research_project` |
| `PUT` | `/innovation/events/:id` | Innovation admin | Update event fields |
| `DELETE` | `/innovation/events/:id` | Innovation admin | Delete event (cascades to participants and scores) |

### Innovation Participants
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/innovation/participants` | Innovation session | All participants. Coordinators see only their department's participants |
| `GET` | `/innovation/participants/:id` | Innovation admin | Single participant |
| `POST` | `/innovation/participants` | Innovation admin | Add participant. Body: `{ event_id, admission_number, full_name, department_id }` |
| `PUT` | `/innovation/participants/:id` | Innovation admin | Update participant |
| `DELETE` | `/innovation/participants/:id` | Innovation admin | Delete participant |
| `POST` | `/innovation/participants/import` | Innovation admin | Bulk import. Body: `{ participants: [{ event_id, admission_number, full_name, department_id }] }`. Uses DB transaction; returns count of imported rows and array of invalid rows |

### Innovation Skills Categories
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/innovation/categories` | Public | All active categories with department names |
| `POST` | `/innovation/categories` | Innovation admin | Create category. Body: `{ department_id, name, description? }` |

### Innovation Scores
| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/innovation/scores` | Innovation coordinator | Submit or update a score. Body: `{ participant_id, event_id, category_id, score, remarks? }`. `score` must be 0–100. Uses `INSERT ... ON DUPLICATE KEY UPDATE` |
| `GET` | `/innovation/scores/ranking` | Public | Ranked results. Required query params: `?event_id=<n>&category_id=<n>` |
