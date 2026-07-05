-- ==========================================================================
-- PORTFOLIO DB SCHEMA (PostgreSQL / Oracle Dual-Engine Compliant)
-- Optimized for Financial Transaction Integrity and Newsletter Subscriptions
-- ==========================================================================

-- 1. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE newsletter_subscribers (
    subscriber_id     VARCHAR2(50) DEFAULT SYS_GUID() PRIMARY KEY, -- Oracle GUID / UUID
    email             VARCHAR2(255) NOT NULL UNIQUE,
    first_name        VARCHAR2(100),
    status            VARCHAR2(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'UNSUBSCRIBED', 'BOUNCED')),
    subscribed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    unsubscribed_at   TIMESTAMP
);

-- Index for fast lookup by email
CREATE UNIQUE INDEX idx_subscribers_email ON newsletter_subscribers (email);

-- 2. COURSES TABLE
CREATE TABLE courses (
    course_id         VARCHAR2(50) PRIMARY KEY,
    title             VARCHAR2(255) NOT NULL,
    description       CLOB, -- Oracle CLOB / PostgreSQL TEXT
    price_cents       NUMBER(10) NOT NULL, -- Stored in cents (e.g. 4990 for $49.90)
    currency          VARCHAR2(3) DEFAULT 'USD' NOT NULL,
    stripe_price_id   VARCHAR2(100) NOT NULL,
    is_active         NUMBER(1) DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. ORDERS / PURCHASES TABLE
CREATE TABLE course_orders (
    order_id          VARCHAR2(50) DEFAULT SYS_GUID() PRIMARY KEY,
    course_id         VARCHAR2(50) NOT NULL,
    stripe_session_id VARCHAR2(255) UNIQUE,
    customer_email    VARCHAR2(255) NOT NULL,
    amount_paid       NUMBER(10) NOT NULL,
    currency          VARCHAR2(3) DEFAULT 'USD' NOT NULL,
    payment_status    VARCHAR2(50) NOT NULL, -- 'PAID', 'PENDING', 'FAILED'
    access_token      VARCHAR2(100) NOT NULL UNIQUE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_order_course FOREIGN KEY (course_id) REFERENCES courses (course_id)
);

-- Indexes for financial queries
CREATE INDEX idx_orders_customer ON course_orders (customer_email);
CREATE INDEX idx_orders_status ON course_orders (payment_status);

-- 4. DIGITAL DOWNLOAD LOGS (For Audit Trails)
CREATE TABLE download_logs (
    log_id            VARCHAR2(50) DEFAULT SYS_GUID() PRIMARY KEY,
    order_id          VARCHAR2(50) NOT NULL,
    ip_address        VARCHAR2(45) NOT NULL,
    user_agent        VARCHAR2(500) NOT NULL,
    downloaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_log_order FOREIGN KEY (order_id) REFERENCES course_orders (order_id)
);
