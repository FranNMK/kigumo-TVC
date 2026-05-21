-- ============================================================
-- SEED DATA FOR KIGUMO TVC
-- Sample data for development and testing
-- ============================================================

USE kigumo_tvc;

-- ============================================================
-- 1. DEPARTMENTS (Academic and Non-Academic)
-- ============================================================

-- Academic Departments
INSERT INTO departments (name, type, description) VALUES
('Information Communication Technology', 'academic', 'Department of ICT offering courses in software development, networking, and computer applications to prepare students for the digital economy.'),
('Business Studies', 'academic', 'Department of Business Studies providing training in accounting, secretarial studies, and business management for the corporate world.'),
('Engineering & Technical Studies', 'academic', 'Department of Engineering offering hands-on training in electrical, mechanical, and civil engineering technologies.'),
('Hospitality & Institutional Management', 'academic', 'Department of Hospitality training students in food production, catering, and hotel management for the hospitality industry.'),
('Applied Sciences', 'academic', 'Department of Applied Sciences focusing on analytical chemistry, biology, and laboratory technology for research and industry.'),
('Social Work & Community Development', 'academic', 'Department of Social Work preparing students for careers in community development, counseling, and social services.');

-- Non-Academic Departments
INSERT INTO departments (name, type, description) VALUES
('Sports & Games', 'non_academic', 'Department of Sports coordinating all college sports activities including football, volleyball, netball, athletics, and indoor games.'),
('Clubs & Societies', 'non_academic', 'Department overseeing student clubs and societies including debate club, drama society, scouting, and religious organizations.'),
('Catering & Accommodation', 'non_academic', 'Department managing student meals, cafeteria services, and hostel accommodation for boarding students.'),
('Guidance & Counseling', 'non_academic', 'Department providing psychological support, career guidance, and personal counseling services to students and staff.'),
('Health & Wellness', 'non_academic', 'Department managing the college clinic, health education programs, and student wellness initiatives.');

-- ============================================================
-- 2. USERS (Students, Lecturers, HODs, Management, Admin)
-- ============================================================
-- NOTE: Passwords are bcrypt hashes of phone numbers:
-- For seed data, these are hashed versions of "0712345678"
-- In production, each user has unique phone number as password

-- Bcrypt hash of "0712345678" with cost factor 12:
SET @seed_password = '$2a$12$LJ3m4ys3Lk0TSwHCpNqrW.9YxGZQJFR5YzSqVf7KKH6Kj8xRhO5Wu';

-- Chief Principal
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, bio, is_active) VALUES
('Dr. Jane Muthoni Kariuki', 'principal@kigumotvc.ac.ke', 'ADMIN/2501/1001', @seed_password, 'chief_principal', 1, 
'Dr. Jane Muthoni Kariuki is the Chief Principal of Kigumo Technical and Vocational College. She holds a PhD in Educational Management from Kenyatta University, a Master of Education in Curriculum Development from the University of Nairobi, and a Bachelor of Education (Science) from Moi University. With over 20 years of experience in TVET education, Dr. Kariuki has been instrumental in transforming Kigumo TVC into a center of excellence in technical training. Under her leadership, the college has achieved ISO 9001:2015 certification and established partnerships with industry leaders across Kenya. She is passionate about competency-based education and ensuring that TVET graduates are equipped with skills that meet industry demands.', 
TRUE);

-- Deputy Principal Academics
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, bio, is_active) VALUES
('Prof. Peter Mwangi Kamau', 'dp.academics@kigumotvc.ac.ke', 'ADMIN/2501/1002', @seed_password, 'deputy_principal', 1,
'Prof. Peter Mwangi Kamau serves as the Deputy Principal in charge of Academic Affairs at Kigumo TVC. He holds a PhD in Technical Education from JKUAT, a Master of Science in Information Systems from the University of Nairobi, and a Bachelor of Education in Technology. With 15 years of experience in curriculum development and academic administration, Prof. Kamau oversees all academic programs, quality assurance, and examination processes. He has led the successful transition of all college programs to CBET curriculum and established the college academic board.',
TRUE);

-- Deputy Principal Administration
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, bio, is_active) VALUES
('Mrs. Catherine Wanjiku Ndung''u', 'dp.administration@kigumotvc.ac.ke', 'ADMIN/2501/1003', @seed_password, 'deputy_principal', 1,
'Mrs. Catherine Wanjiku Ndung''u is the Deputy Principal in charge of Administration and Finance at Kigumo TVC. She holds an MBA in Strategic Management from Kenyatta University and a Bachelor of Commerce from the University of Nairobi. She is a Certified Public Accountant (CPA-K) and a member of ICPAK. With 18 years of administrative experience, Mrs. Ndung''u manages college finances, human resources, infrastructure development, and student welfare services.',
TRUE);

-- System Admin
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, is_active) VALUES
('Mr. David Otieno Okello', 'admin@kigumotvc.ac.ke', 'ADMIN/2501/1004', @seed_password, 'admin', 1, TRUE);

-- HODs
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, bio, is_active) VALUES
('Mr. James Njenga Mwangi', 'james.njenga@kigumotvc.ac.ke', 'LECT/2501/2001', @seed_password, 'hod', 1, 
'Mr. James Njenga is the Head of ICT Department with 10 years of teaching experience. He holds an MSc in Computer Science and specializes in software engineering and database systems.', 
TRUE),
('Mrs. Elizabeth Wambui Maina', 'elizabeth.maina@kigumotvc.ac.ke', 'LECT/2501/2002', @seed_password, 'hod', 2,
'Mrs. Elizabeth Maina is the Head of Business Studies Department. She holds an MBA in Finance and is a certified KASNEB examiner with 12 years of teaching experience.',
TRUE),
('Eng. Patrick Kiprono Rotich', 'patrick.rotich@kigumotvc.ac.ke', 'LECT/2501/2003', @seed_password, 'hod', 3,
'Eng. Patrick Rotich is the Head of Engineering Department. He is a registered professional engineer with the Engineers Board of Kenya (EBK) and holds an MSc in Electrical Engineering.',
TRUE),
('Mrs. Rose Akinyi Ochieng', 'rose.akinyi@kigumotvc.ac.ke', 'LECT/2501/2004', @seed_password, 'hod', 4,
'Mrs. Rose Akinyi is the Head of Hospitality Department with 8 years of industry experience in hotel management and culinary arts.',
TRUE),
('Dr. Michael Barasa Wekesa', 'michael.wekesa@kigumotvc.ac.ke', 'LECT/2501/2005', @seed_password, 'hod', 5,
'Dr. Michael Wekesa is the Head of Applied Sciences Department. He holds a PhD in Analytical Chemistry and has published several research papers in scientific journals.',
TRUE),
('Mrs. Agnes Mueni Mutua', 'agnes.mueni@kigumotvc.ac.ke', 'LECT/2501/2006', @seed_password, 'hod', 6,
'Mrs. Agnes Mutua is the Head of Social Work Department. She holds an MA in Social Work and is a registered social worker with 15 years of field experience.',
TRUE);

-- HOD for Non-Academic Departments
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, bio, is_active) VALUES
('Mr. Tom Odhiambo Onyango', 'tom.odhiambo@kigumotvc.ac.ke', 'LECT/2501/2007', @seed_password, 'hod', 7,
'Mr. Tom Odhiambo is the Sports Director at Kigumo TVC. He holds a Bachelor of Science in Sports Science and is a certified athletics coach.',
TRUE),
('Mrs. Nancy Wairimu Kamande', 'nancy.wairimu@kigumotvc.ac.ke', 'LECT/2501/2008', @seed_password, 'hod', 9,
'Mrs. Nancy Wairimu is the Head of Catering and Accommodation. She holds a Diploma in Institutional Management with 10 years of experience in student welfare.',
TRUE);

-- Additional Lecturers
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, is_active) VALUES
('Mr. Paul Mutua Kioko', 'paul.mutua@kigumotvc.ac.ke', 'LECT/2501/2009', @seed_password, 'lecturer', 1, TRUE),
('Ms. Diana Chelagat Kosgei', 'diana.chelagat@kigumotvc.ac.ke', 'LECT/2501/2010', @seed_password, 'lecturer', 1, TRUE),
('Mr. Stephen Maingi Muthoka', 'stephen.maingi@kigumotvc.ac.ke', 'LECT/2501/2011', @seed_password, 'lecturer', 2, TRUE),
('Mrs. Lucy Nyambura Karanja', 'lucy.nyambura@kigumotvc.ac.ke', 'LECT/2501/2012', @seed_password, 'lecturer', 2, TRUE),
('Eng. Bernard Kiplagat Rono', 'bernard.kiplagat@kigumotvc.ac.ke', 'LECT/2501/2013', @seed_password, 'lecturer', 3, TRUE),
('Mrs. Grace Kaari Muriithi', 'grace.kaari@kigumotvc.ac.ke', 'LECT/2501/2014', @seed_password, 'lecturer', 4, TRUE);

-- Sample Students (Year 1-3, ICT and Business departments)
INSERT INTO users (full_name, email, reg_number, password, role, primary_department_id, year_of_study, is_active) VALUES
('Brian Kipchirchir Kosgei', 'brian.kosgei@student.kigumotvc.ac.ke', 'DICT/2501/1712', @seed_password, 'student', 1, 1, TRUE),
('Mercy Wangui Mwangi', 'mercy.wangui@student.kigumotvc.ac.ke', 'DICT/2501/1713', @seed_password, 'student', 1, 1, TRUE),
('Kevin Omondi Achieng', 'kevin.omondi@student.kigumotvc.ac.ke', 'DICT/2501/1714', @seed_password, 'student', 1, 2, TRUE),
('Faith Nduku Mutiso', 'faith.nduku@student.kigumotvc.ac.ke', 'DICT/2501/1715', @seed_password, 'student', 1, 2, TRUE),
('Joseph Mwenda Miriti', 'joseph.mwenda@student.kigumotvc.ac.ke', 'BUS/2501/1801', @seed_password, 'student', 2, 1, TRUE),
('Ann Wanjiru Karimi', 'ann.wanjiru@student.kigumotvc.ac.ke', 'BUS/2501/1802', @seed_password, 'student', 2, 1, TRUE),
('Peter Muia Nguli', 'peter.muia@student.kigumotvc.ac.ke', 'BUS/2501/1803', @seed_password, 'student', 2, 3, TRUE),
('Susan Kaithi Muthoni', 'susan.kaithi@student.kigumotvc.ac.ke', 'HOSP/2501/1901', @seed_password, 'student', 4, 1, TRUE),
('Daniel Mutuku Mwololo', 'daniel.mutuku@student.kigumotvc.ac.ke', 'ENG/2501/2001', @seed_password, 'student', 3, 2, TRUE),
('Sarah Nasimiyu Wafula', 'sarah.nasimiyu@student.kigumotvc.ac.ke', 'SCI/2501/2101', @seed_password, 'student', 5, 1, TRUE);

-- ============================================================
-- 3. HOD ASSIGNMENTS
-- ============================================================
INSERT INTO hod_assignments (department_id, lecturer_id, assigned_at) VALUES
(1, 5, '2025-01-15'),   -- ICT Dept → James Njenga (user id 5)
(2, 6, '2025-01-15'),   -- Business → Elizabeth Maina (user id 6)
(3, 7, '2025-01-15'),   -- Engineering → Patrick Rotich (user id 7)
(4, 8, '2025-01-15'),   -- Hospitality → Rose Akinyi (user id 8)
(5, 9, '2025-01-15'),   -- Applied Sciences → Michael Wekesa (user id 9)
(6, 10, '2025-01-15'),  -- Social Work → Agnes Mutua (user id 10)
(7, 11, '2025-01-15'),  -- Sports → Tom Odhiambo (user id 11)
(9, 12, '2025-01-15');  -- Catering → Nancy Wairimu (user id 12)

-- ============================================================
-- 4. COURSES
-- ============================================================
INSERT INTO courses (name, duration_years, department_id, examining_body, cbet_status, entry_requirements, description, is_active) VALUES
-- ICT Courses
('Diploma in Information Communication Technology', 3, 1, 'KNEC', TRUE, 
'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English OR Certificate in ICT from a recognized institution.',
'A comprehensive diploma program covering software development, networking, database management, web technologies, and IT support. Graduates are prepared for careers as software developers, network administrators, and IT consultants.',
TRUE),
('Certificate in Information Communication Technology', 2, 1, 'KNEC', TRUE,
'KCSE Mean Grade D+ (Plus) with at least D in Mathematics and English OR KCPE Certificate.',
'A foundational certificate program introducing students to computer applications, basic programming, hardware maintenance, and digital literacy.',
TRUE),
('Diploma in Computer Programming (CDACC)', 3, 1, 'CDACC', TRUE,
'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English.',
'A competency-based diploma focusing on modern programming languages, software development methodologies, mobile app development, and software testing aligned with industry certifications.',
TRUE),

-- Business Courses
('Diploma in Business Management', 3, 2, 'KNEC', TRUE,
'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English or Business Studies.',
'A comprehensive business diploma covering accounting, marketing, human resources, entrepreneurship, and strategic management.',
TRUE),
('Certificate in Secretarial Studies', 2, 2, 'KNEC', TRUE,
'KCSE Mean Grade D+ (Plus) with at least D in English.',
'A certificate program training students in office administration, typing, document management, and office etiquette for administrative careers.',
TRUE),
('ATD Level 1 & 2 (Accounting Technician Diploma)', 2, 2, 'KASNEB', FALSE,
'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics and English.',
'A professional accounting program preparing students for the KASNEB ATD examinations leading to a career in accounting and finance.',
TRUE),

-- Engineering Courses
('Diploma in Electrical Engineering', 3, 3, 'KNEC', TRUE,
'KCSE Mean Grade C- (Minus) with at least D+ in Mathematics, Physics, and English.',
'A diploma program covering electrical installation, power systems, industrial electronics, and renewable energy technologies.',
TRUE),
('Certificate in Mechanical Engineering', 2, 3, 'KNEC', TRUE,
'KCSE Mean Grade D+ (Plus) with at least D in Mathematics and Physics.',
'A foundational program in mechanical engineering covering workshop technology, fitting, welding, and machine operation.',
TRUE),

-- Hospitality Courses
('Diploma in Food Production', 3, 4, 'KNEC', TRUE,
'KCSE Mean Grade C- (Minus) with at least D+ in Home Science or Biology.',
'A culinary arts diploma focusing on professional cooking, baking, food safety, kitchen management, and menu planning.',
TRUE),
('Certificate in Catering & Accommodation', 2, 4, 'KNEC', TRUE,
'KCSE Mean Grade D+ (Plus) with at least D in English.',
'A certificate program in catering covering food preparation, service techniques, housekeeping, and hospitality operations.',
TRUE);

-- ============================================================
-- 5. INTAKE DATES
-- ============================================================
INSERT INTO intake_dates (course_id, intake_date, label) VALUES
(1, '2026-01-12', 'January 2026 Intake'),
(1, '2026-05-04', 'May 2026 Intake'),
(1, '2026-09-07', 'September 2026 Intake'),
(2, '2026-01-12', 'January 2026 Intake'),
(2, '2026-05-04', 'May 2026 Intake'),
(2, '2026-09-07', 'September 2026 Intake'),
(3, '2026-01-12', 'January 2026 Intake'),
(3, '2026-09-07', 'September 2026 Intake'),
(4, '2026-01-12', 'January 2026 Intake'),
(4, '2026-05-04', 'May 2026 Intake'),
(4, '2026-09-07', 'September 2026 Intake'),
(5, '2026-01-12', 'January 2026 Intake'),
(5, '2026-05-04', 'May 2026 Intake'),
(6, '2026-01-12', 'January 2026 Intake'),
(6, '2026-09-07', 'September 2026 Intake'),
(7, '2026-01-12', 'January 2026 Intake'),
(7, '2026-05-04', 'May 2026 Intake'),
(8, '2026-01-12', 'January 2026 Intake'),
(9, '2026-01-12', 'January 2026 Intake'),
(9, '2026-05-04', 'May 2026 Intake'),
(9, '2026-09-07', 'September 2026 Intake'),
(10, '2026-01-12', 'January 2026 Intake'),
(10, '2026-05-04', 'May 2026 Intake');

-- ============================================================
-- 6. FEES STRUCTURE
-- ============================================================
INSERT INTO fees (course_id, year_of_study, tuition, examination, registration, id_card, other, other_label, last_updated) VALUES
-- Diploma in ICT (Year 1-3)
(1, 1, 25000.00, 5000.00, 1000.00, 500.00, 3000.00, 'Computer Lab Fee', '2026-01-05'),
(1, 2, 25000.00, 5000.00, 1000.00, 500.00, 3000.00, 'Computer Lab Fee', '2026-01-05'),
(1, 3, 25000.00, 5000.00, 1000.00, 500.00, 3000.00, 'Computer Lab Fee', '2026-01-05'),
-- Certificate in ICT (Year 1-2)
(2, 1, 18000.00, 4000.00, 1000.00, 500.00, 2000.00, 'Computer Lab Fee', '2026-01-05'),
(2, 2, 18000.00, 4000.00, 1000.00, 500.00, 2000.00, 'Computer Lab Fee', '2026-01-05'),
-- Diploma in Computer Programming (Year 1-3)
(3, 1, 28000.00, 5000.00, 1000.00, 500.00, 3500.00, 'Programming Lab Fee', '2026-01-05'),
(3, 2, 28000.00, 5000.00, 1000.00, 500.00, 3500.00, 'Programming Lab Fee', '2026-01-05'),
(3, 3, 28000.00, 5000.00, 1000.00, 500.00, 3500.00, 'Programming Lab Fee', '2026-01-05'),
-- Diploma in Business Management (Year 1-3)
(4, 1, 22000.00, 5000.00, 1000.00, 500.00, 1500.00, 'Resource Fee', '2026-01-05'),
(4, 2, 22000.00, 5000.00, 1000.00, 500.00, 1500.00, 'Resource Fee', '2026-01-05'),
(4, 3, 22000.00, 5000.00, 1000.00, 500.00, 1500.00, 'Resource Fee', '2026-01-05'),
-- Certificate in Secretarial Studies (Year 1-2)
(5, 1, 16000.00, 4000.00, 1000.00, 500.00, 1500.00, 'Typing Lab Fee', '2026-01-05'),
(5, 2, 16000.00, 4000.00, 1000.00, 500.00, 1500.00, 'Typing Lab Fee', '2026-01-05'),
-- ATD Level 1 & 2
(6, 1, 20000.00, 6000.00, 1500.00, 500.00, 2000.00, 'KASNEB Materials', '2026-01-05'),
(6, 2, 20000.00, 6000.00, 1500.00, 500.00, 2000.00, 'KASNEB Materials', '2026-01-05'),
-- Diploma in Electrical Engineering (Year 1-3)
(7, 1, 30000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Workshop Fee', '2026-01-05'),
(7, 2, 30000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Workshop Fee', '2026-01-05'),
(7, 3, 30000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Workshop Fee', '2026-01-05'),
-- Certificate in Mechanical Engineering (Year 1-2)
(8, 1, 20000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Workshop Fee', '2026-01-05'),
(8, 2, 20000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Workshop Fee', '2026-01-05'),
-- Diploma in Food Production (Year 1-3)
(9, 1, 25000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Kitchen Practical Fee', '2026-01-05'),
(9, 2, 25000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Kitchen Practical Fee', '2026-01-05'),
(9, 3, 25000.00, 5000.00, 1000.00, 500.00, 4000.00, 'Kitchen Practical Fee', '2026-01-05'),
-- Certificate in Catering & Accommodation (Year 1-2)
(10, 1, 18000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Practical Fee', '2026-01-05'),
(10, 2, 18000.00, 4000.00, 1000.00, 500.00, 3000.00, 'Practical Fee', '2026-01-05');

-- ============================================================
-- 7. TIMETABLE ENTRIES (Sample Week for ICT Department)
-- ============================================================
INSERT INTO timetable (department_id, course_id, lecturer_id, subject, day, time_start, time_end, room) VALUES
(1, 1, 5, 'Database Systems', 'Mon', '08:00:00', '10:00:00', 'ICT Lab 1'),
(1, 1, 13, 'Web Development', 'Mon', '10:30:00', '12:30:00', 'ICT Lab 2'),
(1, 1, 14, 'Computer Networks', 'Tue', '08:00:00', '10:00:00', 'ICT Lab 1'),
(1, 3, 13, 'Java Programming', 'Tue', '10:30:00', '12:30:00', 'ICT Lab 2'),
(1, 1, 5, 'System Analysis', 'Wed', '08:00:00', '10:00:00', 'Room 101'),
(1, 2, 14, 'Computer Applications', 'Wed', '10:30:00', '12:30:00', 'ICT Lab 1'),
(1, 3, 5, 'Mobile Development', 'Thu', '08:00:00', '10:00:00', 'ICT Lab 2'),
(1, 1, 13, 'Project Management', 'Thu', '10:30:00', '12:30:00', 'Room 101'),
(1, 2, 14, 'PC Maintenance', 'Fri', '08:00:00', '10:00:00', 'ICT Lab 1'),
(1, 3, 13, 'Software Testing', 'Fri', '10:30:00', '12:30:00', 'ICT Lab 2');

-- ============================================================
-- 8. MATERIALS (Sample Course Materials)
-- ============================================================
INSERT INTO materials (title, description, file_path, file_size, course_id, uploaded_by) VALUES
('Database Systems Module 1 - Introduction to SQL', 'Comprehensive introduction to SQL queries, database design, and normalization concepts.', '/uploads/2026/01/db-module1-uuid123.pdf', 2500, 1, 5),
('Web Development with HTML5 and CSS3', 'Complete guide to modern web development covering semantic HTML, CSS Grid, and responsive design.', '/uploads/2026/01/web-dev-uuid456.pdf', 3200, 1, 13),
('Java Programming Basics', 'Introduction to Java programming language covering variables, control structures, and object-oriented programming.', '/uploads/2026/01/java-basics-uuid789.pdf', 2800, 3, 13),
('Computer Networks Fundamentals', 'Overview of computer networking concepts including OSI model, TCP/IP, and network security.', '/uploads/2026/01/networks-uuid012.pptx', 1500, 1, 14);

-- ============================================================
-- 9. ANNOUNCEMENTS
-- ============================================================
INSERT INTO announcements (title, body, scope, department_id, posted_by) VALUES
('Welcome to January 2026 Semester', 'All students are required to report to their respective departments for orientation on Monday 12th January 2026 at 8:00 AM. New students should bring their admission letters and original certificates for verification.', 'college_wide', NULL, 1),
('ICT Department Industrial Attachment', 'All Year 3 ICT students are required to attend the industrial attachment briefing session on Friday 16th January 2026 at 2:00 PM in ICT Lab 1. Attachment letters will be issued during this session.', 'department', 1, 5),
('College Fee Payment Deadline', 'The deadline for fee payment for the January 2026 semester is 31st January 2026. Students with outstanding balances will not be allowed to sit for continuous assessment tests.', 'college_wide', NULL, 2);

-- ============================================================
-- 10. NEWS ARTICLES
-- ============================================================
INSERT INTO news_articles (title, body, category, image_path, created_by, is_published) VALUES
('Kigumo TVC Achieves ISO 9001:2015 Certification', 
'<p>Kigumo Technical and Vocational College is proud to announce that it has been awarded the prestigious ISO 9001:2015 Quality Management System certification by the Kenya Bureau of Standards (KEBS).</p><p>This certification demonstrates the college commitment to providing quality technical and vocational education that meets international standards. The certification process involved rigorous audits of all academic and administrative processes over a six-month period.</p><p>Chief Principal Dr. Jane Muthoni Kariuki celebrated the achievement, stating, "This certification is a testament to the dedication of our staff and the quality of education we provide at Kigumo TVC. It positions our graduates competitively in the job market both locally and internationally."</p><p>The ISO certification covers all academic programs, student services, and administrative processes at the college. It will be valid for three years with annual surveillance audits to ensure continued compliance.</p>',
'achievement', '/uploads/2026/01/iso-cert-uuid345.jpg', 1, TRUE),

('New CBET Curriculum Launched for ICT Programs',
'<p>Kigumo TVC has officially launched the Competency-Based Education and Training (CBET) curriculum for all Information Communication Technology programs effective January 2026.</p><p>The new curriculum, developed in partnership with CDACC and industry stakeholders, emphasizes hands-on skills development and industry-relevant competencies. Students will spend 60% of their time in practical sessions and 40% in theory classes.</p><p>The CBET programs include Diploma in ICT, Diploma in Computer Programming, and Certificate in ICT. Each program has been aligned with the National Qualifications Framework (NQF) to ensure graduates meet industry requirements.</p>',
'event', '/uploads/2026/01/cbet-launch-uuid678.jpg', 2, TRUE);

-- ============================================================
-- 11. DOWNLOADS
-- ============================================================
INSERT INTO downloads (title, category, file_path, file_size, uploaded_by) VALUES
('January 2026 Admission Form', 'admission', '/uploads/2026/01/admission-form-2026.pdf', 450, 4),
('Medical Examination Form', 'admission', '/uploads/2026/01/medical-form.pdf', 320, 4),
('College Academic Calendar 2026', 'academic', '/uploads/2026/01/academic-calendar-2026.pdf', 280, 2),
('Examination Timetable January 2026', 'academic', '/uploads/2026/01/exam-timetable-jan2026.pdf', 350, 2),
('TVETA Registration Certificate', 'legal', '/uploads/2026/01/tveta-cert.pdf', 1200, 4),
('College Code of Conduct', 'legal', '/uploads/2026/01/code-of-conduct.pdf', 520, 1),
('Student Insurance Policy Document', 'student_welfare', '/uploads/2026/01/insurance-policy.pdf', 680, 3),
('Hostel Rules and Regulations', 'student_welfare', '/uploads/2026/01/hostel-rules.pdf', 400, 3);

-- ============================================================
-- 12. GALLERY ALBUMS
-- ============================================================
INSERT INTO gallery_albums (title, event_date, created_by) VALUES
('Graduation Ceremony 2025', '2025-12-10', 1),
('Cultural Day 2025', '2025-11-15', 2),
('Sports Tournament 2025', '2025-10-20', 11);

-- ============================================================
-- 13. SLIDER SLIDES
-- ============================================================
INSERT INTO slider_slides (image_path, badge_text, heading, subtext, btn1_text, btn1_url, btn2_text, btn2_url, sort_order, created_by) VALUES
('/uploads/2026/01/slide-graduation-uuid001.jpg', 'ISO 9001:2015 Certified', 'Build Your Future with Practical Skills', 'Join Kigumo TVC and gain industry-relevant technical skills that employers are looking for. Over 90% of our graduates secure employment within 6 months.', 'Explore Courses', '/courses.html', 'Apply Now', '/admissions.html', 1, 4),
('/uploads/2026/01/slide-lab-uuid002.jpg', 'CBET Curriculum', 'Competency-Based Training for Real-World Success', 'Our newly launched CBET programs ensure you learn by doing with state-of-the-art workshops, labs, and industry attachments.', 'Our Programs', '/courses.html', 'Visit Us', '/contact.html', 2, 4),
('/uploads/2026/01/slide-campus-uuid003.jpg', 'Join January 2026', 'Admissions Now Open for 2026 Intake', 'Apply for Diploma and Certificate programs in ICT, Business, Engineering, Hospitality, and more. Limited slots available.', 'How to Apply', '/admissions.html', 'Download Forms', '/downloads.html', 3, 4);

-- ============================================================
-- 14. PRINCIPAL MESSAGE
-- ============================================================
INSERT INTO principal_message (principal_name, title, message, image_path, created_by) VALUES
('Dr. Jane Muthoni Kariuki', 'Chief Principal - Kigumo Technical and Vocational College',
'<p>Welcome to Kigumo Technical and Vocational College, a premier institution dedicated to empowering the youth of Kirinyaga County and beyond with practical, industry-relevant skills. Since assuming office as Chief Principal, my vision has been to transform this college into a center of excellence where students are not just educated but are equipped to thrive in the modern workforce.</p>

<p>At Kigumo TVC, we believe in the philosophy of "Skills for Self-Reliance." Our programs are designed in consultation with industry partners to ensure that what you learn here directly translates to employable skills. We have invested heavily in modern workshops, computer laboratories, culinary kitchens, and engineering workshops to provide hands-on training that mirrors real workplace environments.</p>

<p>Our recent achievement of ISO 9001:2015 certification and the transition to Competency-Based Education and Training (CBET) curriculum are testaments to our commitment to quality. We are regulated by TVETA and our programs are examined by reputable bodies including KNEC, KASNEB, and CDACC, ensuring that your qualifications are recognized nationally and internationally.</p>

<p>I invite you to explore our website, visit our beautiful campus in Kigumo Town, and discover how Kigumo Technical and Vocational College can be your partner in building a successful career. Remember, technical skills are the engine of economic growth, and at Kigumo TVC, we are building that engine, one skilled graduate at a time.</p>

<p>Karibu Sana!</p>',
'/uploads/2026/01/principal-photo-uuid999.jpg', 4);

-- ============================================================
-- 15. BOM MEMBERS
-- ============================================================
INSERT INTO bom_members (full_name, position, sort_order) VALUES
('Hon. Dr. Patrick Nduati Mwangi', 'BOM Chairperson', 1),
('Dr. Jane Muthoni Kariuki', 'Secretary to the Board / Chief Principal', 2),
('Mr. Samuel Kariuki Wambugu', 'Member - County Government Representative', 3),
('Mrs. Rose Wanjiku Githinji', 'Member - TVETA Representative', 4),
('Prof. James Kamande Thuo', 'Member - University Representative', 5),
('Mr. Peter Ndung''u Karanja', 'Member - Industry Representative', 6),
('Mrs. Agnes Muthoni Mbugua', 'Member - Community Representative', 7),
('Mr. John Kiprotich Bett', 'Member - Staff Representative', 8);

-- ============================================================
-- 16. PAGE CONTENT (Initial content for editable sections)
-- ============================================================
INSERT INTO page_content (page_key, section_key, content_html) VALUES
('about', 'history', '<h3>Our History</h3><p>Kigumo Technical and Vocational College was established in 2015 by the Government of Kenya through the Ministry of Education to provide quality technical and vocational education to the youth of Kirinyaga County and the surrounding regions. The college is located in Kigumo Town, along the Kutus-Kianyaga road, approximately 5 kilometers from Kutus town.</p><p>Since its inception, the college has grown from an initial enrollment of 120 students to over 1,200 students pursuing various certificate and diploma programs. We are fully accredited by the Technical and Vocational Education and Training Authority (TVETA) and have established partnerships with industry leaders to ensure our training remains relevant to market demands.</p>'),
('about', 'charter', '<h3>Our Service Charter</h3><p>At Kigumo TVC, we are committed to:</p><ul><li>Providing quality technical and vocational education that meets national and international standards</li><li>Ensuring timely release of examination results within 30 days after KNEC/KASNEB/CDACC release</li><li>Processing admission applications within 48 hours of submission</li><li>Responding to all student queries and complaints within 24 hours</li><li>Maintaining transparent fee structures with no hidden charges</li><li>Providing a safe, inclusive, and conducive learning environment</li><li>Offering career guidance and industrial attachment placement support</li></ul>'),
('about', 'vision', '<h3>Our Vision</h3><p>To be a leading center of excellence in technical and vocational education and training in Kenya, producing skilled graduates who drive economic transformation.</p>'),
('about', 'mission', '<h3>Our Mission</h3><p>To provide quality, accessible, and relevant technical and vocational education that equips learners with practical skills, knowledge, and attitudes for employment, self-reliance, and lifelong learning.</p>'),
('about', 'core_values', '<h3>Our Core Values</h3><ul><li><strong>Excellence:</strong> We strive for the highest standards in everything we do</li><li><strong>Integrity:</strong> We uphold honesty, transparency, and ethical conduct</li><li><strong>Innovation:</strong> We embrace creativity and continuous improvement</li><li><strong>Inclusivity:</strong> We respect diversity and ensure equal opportunities for all</li><li><strong>Teamwork:</strong> We collaborate to achieve common goals</li><li><strong>Accountability:</strong> We take responsibility for our actions and outcomes</li></ul>'),
('admissions', 'how_to_apply', '<h3>How to Apply</h3><p>There are two main pathways to join Kigumo Technical and Vocational College:</p><h4>1. Direct Application (Walk-in)</h4><ol><li>Visit the college admissions office with your KCSE results slip/certificate</li><li>Fill in the application form (or download it from our downloads page)</li><li>Submit the form with copies of your certificates and national ID/birth certificate</li><li>Pay the registration fee of Ksh 1,000 at any KCB Bank branch (Account: 1234567890, Kigumo TVC)</li><li>Receive your admission letter within 48 hours</li></ol><h4>2. KUCCPS Placement</h4><p>Students placed by KUCCPS should follow the placement letter instructions and report to the college with the required documents for verification and registration.</p>'),
('admissions', 'requirements', '<h3>General Entry Requirements</h3><p><strong>Diploma Programs:</strong> KCSE Mean Grade C- (Minus) and above with relevant cluster subjects</p><p><strong>Certificate Programs:</strong> KCSE Mean Grade D+ (Plus) and above</p><p><strong>Artisan Programs:</strong> KCPE Certificate or its equivalent</p><p><strong>Computer Packages:</strong> Open to all, no minimum academic requirement</p>');

-- ============================================================
-- 17. STUDENT NON-ACADEMIC MEMBERSHIPS (Sample)
-- ============================================================
INSERT INTO student_non_academic_memberships (student_id, department_id, joined_at) VALUES
(15, 7, '2025-01-15'),  -- Brian Kosgei → Sports
(15, 8, '2025-01-15'),  -- Brian Kosgei → Clubs
(16, 8, '2025-01-15'),  -- Mercy Wangui → Clubs
(17, 7, '2025-01-15'),  -- Kevin Omondi → Sports
(18, 11, '2025-01-15'); -- Faith Nduku → Health & Wellness

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- After running this seed file, verify with:
-- SELECT COUNT(*) FROM departments;  -- Should show 11 (6 academic + 5 non-academic)
-- SELECT COUNT(*) FROM users;         -- Should show 26 (4 management/admin + 8 HODs + 6 lecturers + 8 students)
-- SELECT COUNT(*) FROM courses;       -- Should show 10
-- SELECT COUNT(*) FROM news_articles WHERE is_published = 1; -- Should show 2