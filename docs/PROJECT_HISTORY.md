# PROJECT_HISTORY.md — Kigumo TVC

---

## Origins & Purpose

<!-- PLACEHOLDER — provide a 2–4 sentence answer to each prompt below, then delete the prompts. -->

**What was the problem this system was built to solve?**
> [What manual or paper-based process did it replace? What specific pain point at Kigumo TVC prompted the build?]

**Who commissioned or requested it?**
> [Name and role of the person/institution who requested the project, if any.]

**When did work begin?**
> [Approximate month and year development started.]

---

## Timeline

<!-- PLACEHOLDER — fill in the key dates you remember. Add or remove rows as needed. -->

| Date | Event |
|---|---|
| [Month Year] | Project started |
| [Month Year] | First deployed version went live |
| [Month Year] | Migrated from Railway to cPanel hosting (evidenced in code: `railwayOrigins` legacy block in `server/index.js` line 39–42) |
| [Month Year] | Innovation Portal sub-system added |
| [Month Year] | Online applications feature added |
| [Month Year] | TiDB Cloud adopted as database (replacing any prior DB) |
| [Month Year] | Handover to new maintainer |

---

## Major Decisions

The following decisions are evidenced directly in the code. Reasons are left for Frank to complete.

**1. Railway → cPanel migration**
The codebase contains a `railwayOrigins` array in `server/index.js` (line 39–42) with the Railway URL hardcoded. This confirms the system was previously deployed on Railway before being moved to cPanel/Passenger hosting at Webcom Kenya.

> [Reason for migration — cost, performance, institutional requirement, or other:]

**2. Local disk storage for downloads and materials**
Course materials and public downloads are stored in `public/uploads/` on the cPanel server, not in Cloudinary. Other content (news images, staff photos, application documents) goes to Cloudinary. This split is visible in `server/routes/materials.js` and `server/routes/admin.js` download routes.

> [Reason for this split — was it an intentional decision or a migration that wasn't completed?]

**3. Phone number as password**
All user passwords are the user's phone number, hashed with bcrypt. This is explicit in the auth route comments (`server/routes/auth.js` line 44: "password (phone number)").

> [Reason this approach was chosen over email-based passwords or a generated password system:]

**4. Separate Innovation Portal authentication**
The Innovation Portal has its own user table (`innovation_users`) and its own session key (`req.session.innovationUser`), independent of the main portal. Both sessions can exist simultaneously in the same browser.

> [Reason for separating innovation portal users from main users:]

**5. TiDB Cloud Serverless as database**
TiDB Cloud (MySQL 8.0 compatible) was chosen over a local MySQL instance.

> [Reason — cost, scalability, availability, or other:]

---

## Challenges Faced

<!-- PLACEHOLDER — describe real challenges encountered. Suggested prompts below. -->

**1. cPanel NPROC / 503 issue**
The hosting environment hit its entry-process limit (100) during Cloudinary upload operations, causing 503 errors. Webcom Kenya support confirmed 842 limit hits in a 24-hour period. No code-level fix has been applied as of handover (no timeout on Cloudinary calls, no upload rate control).

> [Any additional context about when this was first noticed, how often it occurred, or any temporary workarounds used in production:]

**2. [Other challenges]**
> [Describe any other significant technical or organisational challenges you encountered during development or deployment.]

---

## Acknowledgements

<!-- PLACEHOLDER — list everyone who contributed to the project and their role. -->

| Name | Role / Contribution |
|---|---|
| [Name] | [e.g. Lead developer] |
| [Name] | [e.g. Project sponsor / requester] |
| [Name] | [e.g. Database design] |
| [Name] | [e.g. UI/UX feedback] |
| [Name] | [e.g. Testing] |
| Webcom Kenya | Hosting provider — cPanel + Node.js Selector environment |
