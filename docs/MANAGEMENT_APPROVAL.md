# MANAGEMENT_APPROVAL.md — Kigumo TVC System Handover

---

## Project Summary

<!-- PLACEHOLDER — review and edit the draft below, then delete this comment. Do not expand or promote it; keep it factual. -->

> **For  Review:**
> The Kigumo TVC College Management System is a web application serving the public-facing website of Kigumo Technical and Vocational College and an authenticated staff and student portal. It manages course information, student records, course materials, timetables, announcements, online admissions, and a separate Innovation Portal for skills competitions. The system is hosted on cPanel at Webcom Kenya and uses TiDB Cloud as its database and Cloudinary for media file storage. Development was carried out by Simon Katampoi Mbatiany & Francis Kienji. The system has been in production use since 22/07/2026.

---

## Current Status

The system is operational as of the handover date. The following components are working:

- Public website (courses, departments, news, downloads, admissions, contact)
- Staff and student portal (login, dashboards by role, materials, timetables, announcements)
- Admin control panel (full content management, user management, applications, recycle bin)
- Online application submission with document upload
- Innovation Portal (events, participant registration, scoring, public results)

---

## Outstanding Items

The following items require attention after handover. They are described in plain terms; full technical detail is in `docs/KNOWN_ISSUES.md`.

| # | Item | Impact | Action Required |
|---|---|---|---|
| 1 | **Website may temporarily go offline during large file uploads** | Intermittent 503 errors visible to all users | Developer needs to add a timeout limit on file upload calls. No workaround currently in place |
| 2 | **Database connection not fully verified** | Low risk currently; encrypted but not authenticated | Download certificate from TiDB Cloud dashboard and set in server config |
| 3 | **Photo gallery feature not complete** | Gallery pages not accessible to users | Feature was started (database tables exist) but not finished. Needs developer time to build |
| 4 | **Some older course material files may not download** | Students attempting to download affected files will see an error | Affected files need to be re-uploaded by the relevant lecturers |
| 5 | **No automated test suite** | Changes to the system cannot be automatically verified for regressions | A test suite should be written before significant new features are added |
| 6 | **Legacy hosting reference in code** | No user-facing impact | Developer should remove the old Railway hosting reference from the codebase when confirmed no longer needed |

---

## Sign-Off

By signing below, the receiving party confirms that:

1. They have been briefed on the current state of the system, including the outstanding items listed above.
2. They accept responsibility for the ongoing maintenance and operation of the system.
3. They have received or have been arranged to receive all credentials listed in `docs/HANDOVER_CHECKLIST.md`.

---

**Outgoing developers / maintainer**

Name: _______________________________________________

Role: _______________________________________________

Signature: _______________________________________________

Date: _______________________________________________

Name: _______________________________________________

Role: _______________________________________________

Signature: _______________________________________________

Date: _______________________________________________

---

**Receiving representative(s) (management)**

Name: _______________________________________________

Role / Title: _______________________________________________

Signature: _______________________________________________

Date: _______________________________________________

Name: _______________________________________________

Role / Title: _______________________________________________

Signature: _______________________________________________

Date: _______________________________________________

---

**Witnessed by (optional)**

Name: _______________________________________________

Role / Title: _______________________________________________

Signature: _______________________________________________

Date: _______________________________________________
