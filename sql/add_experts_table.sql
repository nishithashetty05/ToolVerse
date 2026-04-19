-- =============================================================
-- ToolVerse — Experts Table Migration
-- Run once against your Neon / PostgreSQL database
-- =============================================================

CREATE TABLE IF NOT EXISTS experts (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT REFERENCES users(id) ON DELETE SET NULL,

  name         VARCHAR(255) NOT NULL,
  specialty    VARCHAR(255) NOT NULL,   -- e.g. "Soil Health", "Irrigation"
  bio          TEXT,
  location     VARCHAR(255) NOT NULL,

  phone        VARCHAR(20),
  email        VARCHAR(255),
  avatar_url   VARCHAR(500),

  years_exp    SMALLINT CHECK (years_exp >= 0),
  rate_per_day NUMERIC(10, 2) CHECK (rate_per_day > 0),

  available    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: search by location
CREATE INDEX IF NOT EXISTS idx_experts_location
  ON experts USING btree (location);

-- Index: filter by availability
CREATE INDEX IF NOT EXISTS idx_experts_available
  ON experts USING btree (available);

-- Index: speciality filter
CREATE INDEX IF NOT EXISTS idx_experts_specialty
  ON experts USING btree (specialty);

-- Seed data — sample experts (optional, safe to skip)
INSERT INTO experts (name, specialty, bio, location, phone, email, years_exp, rate_per_day, available)
VALUES
  ('Rajan Kumar',    'Soil Health & Fertilisation', 'Certified agronomist with 15 years helping farmers improve yield through soil analysis.', 'Hassan, Karnataka',   '+91 98765 00001', 'rajan@example.com',  15, 1200, true),
  ('Sunita Devi',    'Irrigation & Water Management', 'Expert in drip and sprinkler irrigation systems for water-scarce regions.', 'Anantapur, Andhra Pradesh', '+91 98765 00002', 'sunita@example.com', 12, 900,  true),
  ('Mohan Patil',    'Pest & Disease Control',     'Ph.D. in entomology. Specialises in organic and IPM-based pest control.', 'Pune, Maharashtra',   '+91 98765 00003', 'mohan@example.com',  8,  1500, true),
  ('Lakshmi Reddy',  'Organic Farming',            'Pioneer in zero-budget natural farming. Trainer for 500+ farmers.', 'Guntur, Andhra Pradesh',   '+91 98765 00004', 'lreddy@example.com', 20, 1000, true),
  ('Arjun Singh',    'Tractor & Equipment Repair', 'Certified mechanic for John Deere, Mahindra, and TAFE equipment.', 'Ludhiana, Punjab',    '+91 98765 00005', 'arjun@example.com',  10, 800,  false),
  ('Priya Nair',     'Greenhouse & Horticulture',  'Helps farmers set up poly-houses and controlled environment agriculture.', 'Thrissur, Kerala',  '+91 98765 00006', 'priya@example.com',  7,  1100, true)
ON CONFLICT DO NOTHING;
