-- ============================================================
-- ADDITIONAL TABLES FOR KIGUMO TVC
-- Tables 16-20 to be added to existing schema
-- ============================================================

-- TABLE 16: slider_slides
-- Stores hero slider content for homepage
CREATE TABLE IF NOT EXISTS slider_slides (
    id INT PRIMARY KEY AUTO_INCREMENT,
    image_path VARCHAR(255) NOT NULL COMMENT 'Path relative to /uploads/',
    badge_text VARCHAR(100) DEFAULT NULL COMMENT 'Small badge text overlaid on slide',
    heading VARCHAR(200) DEFAULT NULL COMMENT 'Main heading text',
    subtext TEXT DEFAULT NULL COMMENT 'Descriptive subtext',
    btn1_text VARCHAR(80) DEFAULT NULL COMMENT 'First button label',
    btn1_url VARCHAR(255) DEFAULT NULL COMMENT 'First button destination URL',
    btn2_text VARCHAR(80) DEFAULT NULL COMMENT 'Second button label',
    btn2_url VARCHAR(255) DEFAULT NULL COMMENT 'Second button destination URL',
    sort_order INT DEFAULT 0 COMMENT 'Display order (lower numbers first)',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT DEFAULT NULL COMMENT 'FK to users(id) - admin who created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_slider_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 17: principal_message
-- Stores the Chief Principal's welcome message for homepage
CREATE TABLE IF NOT EXISTS principal_message (
    id INT PRIMARY KEY AUTO_INCREMENT,
    principal_name VARCHAR(100) DEFAULT NULL COMMENT 'Full name of the chief principal',
    title VARCHAR(100) DEFAULT NULL COMMENT 'Official title e.g. Chief Principal',
    message LONGTEXT DEFAULT NULL COMMENT 'Full message body text',
    image_path VARCHAR(255) DEFAULT NULL COMMENT 'Principal photo path',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Only one record should be active at a time',
    created_by INT DEFAULT NULL COMMENT 'FK to users(id) - admin who created',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_principal_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 18: page_content
-- Stores editable HTML content for various page sections
CREATE TABLE IF NOT EXISTS page_content (
    id INT PRIMARY KEY AUTO_INCREMENT,
    page_key VARCHAR(100) NOT NULL COMMENT 'Identifier for the page e.g. about, admissions',
    section_key VARCHAR(100) NOT NULL COMMENT 'Identifier for the section e.g. history, charter',
    content_html LONGTEXT DEFAULT NULL COMMENT 'Rich HTML content for the section',
    updated_by INT DEFAULT NULL COMMENT 'FK to users(id) - admin who last updated',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_page_section (page_key, section_key),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_page_key (page_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 19: recycle_bin
-- Soft delete recovery system with 30-day retention
CREATE TABLE IF NOT EXISTS recycle_bin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    original_table VARCHAR(100) NOT NULL COMMENT 'Table name where data originated',
    original_id INT NOT NULL COMMENT 'Primary key ID of the deleted record',
    data_snapshot LONGTEXT NOT NULL COMMENT 'JSON string of the complete row data',
    deleted_by INT DEFAULT NULL COMMENT 'FK to users(id) - who performed the deletion',
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When the deletion occurred',
    restore_deadline TIMESTAMP GENERATED ALWAYS AS (deleted_at + INTERVAL 30 DAY) STORED COMMENT 'Auto-calculated: 30 days from deletion',
    FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_restore_deadline (restore_deadline),
    INDEX idx_original_table (original_table)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE 20: bom_members
-- Board of Management members for about page display
CREATE TABLE IF NOT EXISTS bom_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL COMMENT 'BOM member full name',
    position VARCHAR(100) DEFAULT NULL COMMENT 'Position/title on the board',
    photo_path VARCHAR(255) DEFAULT NULL COMMENT 'Member photo path',
    sort_order INT DEFAULT 0 COMMENT 'Display order',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bom_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;