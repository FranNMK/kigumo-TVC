CREATE DATABASE IF NOT EXISTS kigumo_tvc;
USE kigumo_tvc;

-- 1. DEPARTMENTS
CREATE TABLE departments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  type        ENUM('academic','non_academic') NOT NULL DEFAULT 'academic',
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. USERS
CREATE TABLE users (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  full_name             VARCHAR(100) NOT NULL,
  email                 VARCHAR(100) UNIQUE,
  reg_number            VARCHAR(50) UNIQUE,
  password              VARCHAR(255) NOT NULL,
  role                  ENUM('student','lecturer','admin') NOT NULL,
  primary_department_id INT,
  year_of_study         INT DEFAULT NULL,
  photo_path            VARCHAR(255) DEFAULT NULL,
  bio                   TEXT DEFAULT NULL,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (primary_department_id) REFERENCES departments(id)
);

-- 3. HOD ASSIGNMENTS
CREATE TABLE hod_assignments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL UNIQUE,
  lecturer_id   INT NOT NULL,
  assigned_at   DATE NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (lecturer_id)   REFERENCES users(id)
);

-- 4. STUDENT NON-ACADEMIC MEMBERSHIPS
CREATE TABLE student_non_academic_memberships (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL,
  department_id INT NOT NULL,
  joined_at     DATE DEFAULT (CURRENT_DATE),
  UNIQUE KEY unique_membership (student_id, department_id),
  FOREIGN KEY (student_id)    REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 5. COURSES
CREATE TABLE courses (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(150) NOT NULL,
  duration_years     INT NOT NULL,
  department_id      INT NOT NULL,
  examining_body     ENUM('KNEC','KASNEB','CDACC') NOT NULL,
  cbet_status        BOOLEAN DEFAULT FALSE,
  entry_requirements TEXT,
  description        TEXT,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 6. INTAKE DATES
CREATE TABLE intake_dates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  course_id   INT NOT NULL,
  intake_date DATE NOT NULL,
  label       VARCHAR(100),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 7. FEES
CREATE TABLE fees (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  course_id     INT NOT NULL,
  year_of_study INT NOT NULL,
  tuition       DECIMAL(10,2) DEFAULT 0,
  examination   DECIMAL(10,2) DEFAULT 0,
  registration  DECIMAL(10,2) DEFAULT 0,
  id_card       DECIMAL(10,2) DEFAULT 0,
  other         DECIMAL(10,2) DEFAULT 0,
  other_label   VARCHAR(100),
  last_updated  DATE,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- 8. TIMETABLE
CREATE TABLE timetable (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  course_id     INT NOT NULL,
  lecturer_id   INT NOT NULL,
  subject       VARCHAR(100) NOT NULL,
  day           ENUM('Mon','Tue','Wed','Thu','Fri') NOT NULL,
  time_start    TIME NOT NULL,
  time_end      TIME NOT NULL,
  room          VARCHAR(50),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (course_id)     REFERENCES courses(id),
  FOREIGN KEY (lecturer_id)   REFERENCES users(id)
);

-- 9. COURSE MATERIALS
CREATE TABLE materials (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  file_path   VARCHAR(255) NOT NULL,
  file_size   INT,
  course_id   INT NOT NULL,
  uploaded_by INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id)   REFERENCES courses(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 10. ANNOUNCEMENTS
CREATE TABLE announcements (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  body          TEXT NOT NULL,
  scope         ENUM('college_wide','department') DEFAULT 'college_wide',
  department_id INT DEFAULT NULL,
  posted_by     INT NOT NULL,
  posted_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (posted_by)     REFERENCES users(id)
);

-- 11. NEWS ARTICLES
CREATE TABLE news_articles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  body         LONGTEXT NOT NULL,
  category     ENUM('event','partnership','graduation','achievement','general') DEFAULT 'general',
  image_path   VARCHAR(255),
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by   INT NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 12. DOWNLOADS
CREATE TABLE downloads (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  category    ENUM('admission','academic','legal','student_welfare') NOT NULL,
  file_path   VARCHAR(255) NOT NULL,
  file_size   INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT NOT NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 13. GALLERY ALBUMS
CREATE TABLE gallery_albums (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(150) NOT NULL,
  event_date DATE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 14. GALLERY PHOTOS
CREATE TABLE gallery_photos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  album_id  INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  caption   VARCHAR(200),
  FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
);

-- 15. CONTACT ENQUIRIES
CREATE TABLE contact_enquiries (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  full_name    VARCHAR(100) NOT NULL,
  email        VARCHAR(100) NOT NULL,
  subject      VARCHAR(200),
  message      TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read      BOOLEAN DEFAULT FALSE
);