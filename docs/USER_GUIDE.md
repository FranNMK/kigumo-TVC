# USER_GUIDE.md — Kigumo TVC Staff & Student Portal

This guide covers the actions each role can perform in the portal. It does not cover the public website, which requires no login.

---

## Logging In

1. Open your browser and go to `https://kigumotvc.ac.ke/portal/login` (or the address given to you by the admin).
2. **Students:** enter your registration number (e.g. `DICT/2501/1712`) and your phone number as the password.
3. **Staff (lecturers, HODs, management, admin):** enter your email address and your phone number as the password.
4. After a successful login you are taken to the dashboard for your role automatically.

**Locked out?** After 5 failed attempts from the same device/network, the system blocks further attempts for 15 minutes. Wait and try again. If you have forgotten your password, contact the admin to reset it — there is no self-service password reset.

---

## Role: Student

Students can view information that relates to their own department and registration number.

### View your timetable
- Go to your student dashboard.
- Your class schedule for your department is shown, including subject, day, time, room, and lecturer name.

### View course materials
- On your dashboard, open the **Materials** section.
- Only materials assigned to your intake cohort (matched by your admission number prefix) are visible.
- Click a material title to download the file.

### View announcements
- Announcements sent college-wide, or specifically to your department, appear in the **Announcements** section.

### What students cannot do
- Students cannot post announcements, upload materials, or access other students' data.

---

## Role: Lecturer

Lecturers can manage their own course materials and communicate with their department.

### View your timetable
- Your dashboard shows your own teaching slots: subject, day, time, room, and department.

### Upload a course material
1. In the **Materials** section, click **Upload Material**.
2. Fill in: title, description (optional), course, and which cohort(s) should see this file.
   - Cohorts are listed by intake batch code (e.g. `2501`). Select one or more.
3. Choose a file (allowed formats: PDF, Word, PowerPoint, image, MP4, plain text; maximum 50 MB).
4. Click **Upload**.
5. The file is saved to the server and becomes visible to students in the selected cohort(s).

### Edit or delete a material
- In your materials list, you can change the title or description of any material you uploaded.
- You can delete a material you uploaded. This removes the file from the server.

### Post an announcement
1. Go to **Announcements** → **New Announcement**.
2. Enter a title and message.
3. Choose scope: **College-wide** (visible to all portal users) or **Department** (visible only to your department).
4. Submit. The announcement appears immediately.

### What lecturers cannot do
- Lecturers cannot add or remove students — that is the HOD's responsibility.
- Lecturers cannot edit materials uploaded by other lecturers.

---

## Role: Head of Department (HOD)

HODs have all lecturer permissions, plus the ability to manage students in their own department.

### All lecturer actions apply (see above)

### View students in your department
- Go to **Students** on your dashboard.
- You see only students assigned to your department: name, registration number, year of study.

### Add a student to your department
1. Click **Add Student**.
2. Enter: full name, registration number (format: `DEPT/YEAR/NUMBER`), phone number (this becomes the student's password), year of study, and optionally email.
3. Submit. The student account is created and they can log in immediately.

> You can only add students to your own department. The system blocks attempts to add to a different department.

### Post a department-scoped announcement
- Same as lecturers. Choose **Department** scope and the announcement is limited to your department.

### What HODs cannot do
- HODs cannot edit user details for existing accounts (other than adding new students) — contact the admin for that.
- HODs cannot create or delete courses or departments.

---

## Role: Management (Chief Principal, Deputy Principal Academics, Deputy Principal Administration)

Management has read-only access to a summary dashboard. They cannot add, edit, or delete any content.

### View the overview
- The **Overview** section shows:
  - Total active students
  - Total active lecturers and HODs
  - Total active courses
  - Total departments

### View the department resource matrix
- The **Departments** section lists each academic department with:
  - Assigned HOD name
  - Number of uploaded course materials
  - Number of enrolled students

### What management cannot do
- Management roles have no write access anywhere in the portal. All actions are read-only.

---

## Role: Admin

The admin role has full control over the entire system. All actions below are available only to the admin.

### User management
- **Create a user:** any role (student, lecturer, HOD, deputy principal, chief principal, registrar, secretary, dean of students, admin). The phone number is set as the initial password.
- **Edit a user:** update name, email, registration number, department, year of study, bio, photo, active status.
- **Deactivate / reactivate a user:** toggles the `is_active` flag. Deactivated users cannot log in.
- **Reset a user's password:** set a new phone number as password.
- **Delete a user:** moves the user record to the recycle bin (can be restored within the deadline).
- **Assign an HOD to a department:** select a lecturer or existing HOD for any department. The system automatically updates their role and removes any previous HOD from that department.

### Content management (website)
- **Slides:** add, edit, reorder, activate/deactivate, or delete homepage hero slides (images or videos).
- **News articles:** create, edit, publish/unpublish, or delete news articles.
- **Partners:** add, edit, or remove partner logos.
- **Board of Management members:** add, edit, reorder, or remove BOM member profiles.
- **Page content:** edit editable text sections on public pages.
- **Principal's message:** update the principal's name, title, message, and photo.
- **External portals list:** add, edit, or remove entries on the portals listing page.

### Course and department management
- **Departments:** create, edit (name, type, description, vision, mission, objective, image), or delete departments.
- **Courses:** create, edit, activate/deactivate, or delete courses.
- **Fees:** managed through the course editor.
- **Cohorts:** create cohort batches per department; activate or deactivate them.
- **Intake dates:** manage the public-facing intake dates shown on the Admissions page (open/upcoming/closed status). Also configure the intake deadline day offsets per intake month.

### Downloads
- Upload files to the public Downloads page.
- Edit download titles or replace files.
- Delete downloads (moved to recycle bin).
- Manage download categories.

### Applications (online admissions)
- View all submitted applications with status filter and search.
- Change application status: pending → reviewed → accepted / rejected.
- Delete individual applications or bulk-delete (moved to recycle bin with 1-day restore window).

### Contact enquiries
- View all messages submitted via the website contact form.
- Mark enquiries as read.

### Timetable
- View all timetable entries across all departments. (Creating/editing timetable entries is managed directly in the database — there is no admin UI for this currently.)

### Recycle bin
- View all soft-deleted items.
- Restore an item (if within its restore deadline).
- Permanently delete individual items, or empty the entire bin.

---

## Innovation Portal

The Innovation Portal is a separate sub-system with its own login at `/innovation/login`. It uses a different set of accounts from the main portal.

### Innovation Admin
- Create, edit, archive, or delete events (skills competitions, exhibitions, research projects).
- Manage participants: add individually or import in bulk via CSV/JSON.
- Manage scoring categories per department.
- View all scores and participant rankings.

### Innovation Coordinator
- View participants in their own department.
- Submit scores for participants in their assigned department.
- View rankings.

### Public (no login required)
- View the Innovation Portal home page, event listings, and published results/rankings.

---

## Logging Out

Click the logout button on your dashboard. Your session is ended immediately and the browser cookie is cleared. You must log in again to access the portal.

Sessions expire automatically after 30 minutes of inactivity.
