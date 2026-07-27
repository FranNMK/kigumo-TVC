# PROJECT_HISTORY.md — Kigumo TVC

---

## Origins & Purpose

<!-- PLACEHOLDER — provide a 2–4 sentence answer to each prompt below, then delete the prompts. -->

**What was the problem this system was built to solve?**
> The system was built for the purpose of improving the vissibilty of the college online and also helping in mananging of the difrent parts of website automatically

**Who commissioned or requested it?**
> I Francis Kienji came with the idea after seing tha i could even acacess a feees structure online i had to make calls and wait also the website that was there by the time was not proffesioan and standard and some parts were not working at times. I gave Mr Simon the idea and he said that it was good an neccessary and i commenced into developing the website

**When did work begin?**
> The work began in end of april before start of may/august 2026 module commencing when i started doing the coding part few parts everyday 

---

## Timeline

<!-- PLACEHOLDER — fill in the key dates you remember. Add or remove rows as needed. -->

| Date | Event |
|---|---|
| [April 2026] | Project started |
| [End of May 2026] | First deployed version went live |
| [July start 2026] | Migrated from Railway to cPanel hosting (evidenced in code: `railwayOrigins` legacy block in `server/index.js` line 39–42) |
| [During Internal Skills Competions] | Innovation Portal sub-system added |
| [All thrugh after feedback came from the Manangement] | Online applications feature added |
| [Fro Commencing of the project] | TiDB Cloud adopted as database (replacing any prior DB) |
| [Starting End of July 2026] | Handover to new maintainer |

---

## Major Decisions

The following decisions are evidenced directly in the code. Reasons are left for Frank to complete.

**1. Railway → cPanel migration**
The codebase contains a `railwayOrigins` array in `server/index.js` (line 39–42) with the Railway URL hardcoded. This confirms the system was previously deployed on Railway before being moved to cPanel/Passenger hosting at Webcom Kenya.

> Project was deployed to Railways for testing as we develop to a certain that what we do and what gets to proction are as per the requireemnts and as the fedback comes from the manangeent and the Kigumo TVC ICT Team.later now starting July 2026 we have moved to cpanel hosting to connect the github repo o this project to cpanel for making it go live to the main college domain kigumotvc.ac.ke wheer it is currently 

**2. Local disk storage for downloads and materials**
Course materials and public downloads are stored in `public/uploads/` on the cPanel server, not in Cloudinary. Other content (news images, staff photos, application documents) goes to Cloudinary. This split is visible in `server/routes/materials.js` and `server/routes/admin.js` download routes.

> This was becasue the college cpanel hosting service was not and is not accepting gettin of pdfs from cloudinary on images and photos there we had to chnage for downloads to be dynamic as in it via the adminpanel of the website

**3. Phone number as password**
All user passwords are the user's phone number, hashed with bcrypt. This is explicit in the auth route comments (`server/routes/auth.js` line 44: "password (phone number)").

> To make the site access easy and adding of users since no much security is needed

**4. Separate Innovation Portal authentication**
The Innovation Portal has its own user table (`innovation_users`) and its own session key (`req.session.innovationUser`), independent of the main portal. Both sessions can exist simultaneously in the same browser.

> It was for the purpose of helping in mananging the Internal Inovations and Reserach Competions in manangenent and Handling

**5. TiDB Cloud Serverless as database**
TiDB Cloud (MySQL 8.0 compatible) was chosen over a local MySQL instance.

> For availabity every time and to mostly avod the MySQL Molithic Arcitecture also becasue of Horizontal scaling of the databse and transparent sharding

---

## Challenges Faced

<!-- PLACEHOLDER — describe real challenges encountered. Suggested prompts below. -->

**1. cPanel NPROC / 503 issue**
The hosting environment hit its entry-process limit (100) during Cloudinary upload operations, causing 503 errors. Webcom Kenya support confirmed 842 limit hits in a 24-hour period. No code-level fix has been applied as of handover (no timeout on Cloudinary calls, no upload rate control).

> [Any additional context about when this was first noticed, how often it occurred, or any temporary workarounds used in production:]

**2. [Other challenges]**
> Resources shortage of what we needed to develop this site e.g Internet
> Time since we had alot of thins to do
> Discouragemenst

---

## Acknowledgements

<!-- PLACEHOLDER — list everyone who contributed to the project and their role. -->

| Name | Role / Contribution |
|---|---|
| Francis Kieni | [Lead developer |
| Simon Mbatiany | UI/UX feedback & testing  |

| Webcom Kenya | Hosting provider — cPanel + Node.js Selector environment |
