-- MathQuest MySQL schema
-- Run: mysql -u root -p mathquest < schema.sql

CREATE DATABASE IF NOT EXISTS mathquest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mathquest;

CREATE TABLE IF NOT EXISTS users (
  id           VARCHAR(36)  PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name         VARCHAR(255) DEFAULT '',
  role         ENUM('student','admin') DEFAULT 'student',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
  id          VARCHAR(100) PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  icon        VARCHAR(50)  DEFAULT '📚',
  theory      TEXT,
  quizzes     JSON,
  videos      JSON,
  materials   JSON,
  sort_order  INT DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_progress (
  student_id      VARCHAR(36) PRIMARY KEY,
  name            VARCHAR(255) DEFAULT '',
  xp              INT DEFAULT 0,
  level           INT DEFAULT 1,
  streak          INT DEFAULT 0,
  progress        JSON,
  topic_xp        JSON,
  watched_videos  JSON,
  unlocked_topics JSON,
  exam_best_scores JSON,
  unlocked_exams  JSON,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id                  VARCHAR(100) PRIMARY KEY,
  title               VARCHAR(500) NOT NULL,
  description         TEXT,
  topic_id            VARCHAR(100) DEFAULT 'all',
  question_count      INT DEFAULT 10,
  time_limit_minutes  INT DEFAULT 20,
  passing_score       INT DEFAULT 70,
  sort_order          INT DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin foydalanuvchini yaratish:
-- 1) npm run dev ni ishga tushurib
-- 2) POST /api/auth/setup ga so'rov yuboring yoki quyidagi SQL ni to'ldiring:
--
-- INSERT INTO users (id, email, password_hash, name, role)
-- VALUES (UUID(), 'admin@email.com', '<bcrypt_hash>', 'Admin', 'admin');
--
-- Yoki .env.local da SETUP_ADMIN_EMAIL / SETUP_ADMIN_PASSWORD qo'yib
-- POST http://localhost:3000/api/auth/setup ga so'rov yuboring (birinchi marta).
