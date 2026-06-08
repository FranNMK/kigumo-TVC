markdown
# Kigumo TVC — System Requirements

## Runtime Environment

| Requirement | Version |
|-------------|---------|
| Node.js | v22.20.0 (LTS) |
| npm | v10.x (bundled with Node.js) |
| MySQL | 8.0+ (TiDB Cloud Serverless compatible) |

## Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.21.0 | Web framework & API routing |
| mysql2 | ^3.11.0 | MySQL/TiDB database driver (promise-based) |
| express-session | ^1.18.0 | User session management |
| bcryptjs | ^2.4.3 | Password hashing (cost factor 12) |
| multer | ^1.4.5-lts.1 | File upload handling (memory storage) |
| cloudinary | ^1.41.0 | Cloud media storage & delivery |
| dotenv | ^16.4.5 | Environment variable management |
| express-rate-limit | ^7.4.0 | API rate limiting (auth routes) |
| uuid | ^10.0.0 | Unique filename generation |

## Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.1.7 | Auto-restart server on file changes |

## External Services

| Service | Tier | Purpose |
|---------|------|---------|
| TiDB Cloud | Serverless (Free) | Distributed MySQL-compatible database |
| Cloudinary | Free (25GB) | Image/file storage, transformation & CDN |
| Google Translate | Free | Website translation widget (EN ↔ SW) |
| Google Maps | Free | Embedded campus map |

## Environment Variables (.env)

```env
# Server
PORT=4000
NODE_ENV=development
SESSION_SECRET=your-secret-here

# Database (TiDB Cloud)
DB_HOST=gateway01.xxxx.prod.aws.tidbcloud.com
DB_PORT=4000
DB_USER=your-tidb-username
DB_PASSWORD=your-tidb-password
DB_NAME=kigumo_tvc
DB_SSL=true
DB_SSL_CA_PATH=server/certs/tidb-ca.pem

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Logging
LOG_LEVEL=DEBUG
Database Tables (20 tables)
announcements — College & department announcements

bom_members — Board of Management members

cohort_batches — Admission cohorts per department

contact_enquiries — Contact form submissions

courses — Academic courses/programmes

departments — Academic & non-academic departments

downloads — Downloadable documents

fees — Course fee structures

gallery_albums — Photo album categories

gallery_photos — Gallery images

hod_assignments — HOD department assignments

intake_dates — Course intake schedules

material_cohorts — Material-to-cohort access control

materials — Course learning materials

news_articles — Published news & events

page_content — Editable page sections

partners — Partner/accreditor logos

principal_message — Chief Principal welcome message

recycle_bin — Soft-delete recovery (30-day retention)

slider_slides — Homepage hero slider content

student_non_academic_memberships — Club/society memberships

timetable — Class schedules

users — All system users (students, lecturers, HODs, admin)

Browser Support
Browser	Minimum Version
Chrome	90+
Firefox	88+
Edge	90+
Safari	14+
Mobile Chrome	90+
Mobile Safari	14+
Hardware Requirements (Server)
Resource	Minimum	Recommended
CPU	1 vCPU	2 vCPU
RAM	512 MB	1 GB
Storage	1 GB	5 GB SSD
Bandwidth	10 Mbps	50 Mbps
Installation
bash
# Clone repository
git clone https://github.com/FranNMK/kigumo-TVC.git
cd kigumo-TVC

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your TiDB Cloud and Cloudinary credentials

# Initialize database
# Run database/schema.sql and database/seed.sql in TiDB Cloud SQL shell

# Start development server
npm start

# Or with auto-reload
npx nodemon server/index.js
Project Structure
text
kigumo-TVC/
├── database/
│   ├── schema.sql          # Full database schema
│   └── seed.sql            # Sample data
├── logs/                   # Application logs
├── portal/
│   ├── admin/
│   │   └── dashboard.html  # Admin panel
│   ├── lecturer-dashboard.html
│   ├── login.html
│   ├── management-dashboard.html
│   └── student-dashboard.html
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   └── main.css    # Main stylesheet
│   │   ├── images/
│   │   └── js/
│   │       ├── main.js     # Homepage JavaScript
│   │       └── navbar.js   # Shared navbar component
│   ├── about.html
│   ├── admissions.html
│   ├── contact.html
│   ├── courses.html
│   ├── departments.html
│   ├── downloads.html
│   ├── index.html          # Homepage
│   ├── news-article.html   # Single article view
│   └── news.html           # News listing
├── server/
│   ├── certs/              # SSL certificates
│   ├── middleware/
│   │   ├── auth.js         # Authentication middleware
│   │   └── requestLogger.js
│   ├── routes/
│   │   ├── admin.js        # Admin CRUD APIs
│   │   ├── announcements.js
│   │   ├── auth.js         # Login/logout
│   │   ├── bom.js
│   │   ├── contact.js
│   │   ├── content.js
│   │   ├── courses.js
│   │   ├── departments.js
│   │   ├── downloads.js
│   │   ├── management.js
│   │   ├── materials.js
│   │   ├── news.js
│   │   ├── partners.js
│   │   ├── slides.js
│   │   ├── stats.js
│   │   ├── timetable.js
│   │   └── users.js
│   ├── utils/
│   │   ├── cloudinary.js   # Cloudinary helpers
│   │   ├── cloudinaryLogger.js
│   │   ├── dbLogger.js
│   │   └── logger.js
│   ├── db.js               # Database connection pool
│   └── index.js            # Express server entry point
├── uploads/                # Local file uploads (legacy)
├── .env                    # Environment variables
├── .gitignore
├── package.json
└── REQUIREMENTS.md
text

---

Save this as `REQUIREMENTS.md` in your project root. It documents everything needed to run, deploy, or hand over the project — dependencies, services, database tables, environment variables, and folder structure.