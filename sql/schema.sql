-- =============================================================
-- ToolVerse Database Schema
-- DBMS-focused: ENUMs, constraints, indexes, views, triggers
-- =============================================================

-- ---------------------------------------------------------------
-- 1. ENUM TYPES
-- ---------------------------------------------------------------

-- Status of a tool in the system
CREATE TYPE tool_status AS ENUM (
  'available',    -- Ready to be borrowed
  'reserved',     -- Booking confirmed, not yet picked up
  'borrowed',     -- Currently with borrower
  'maintenance'   -- Temporarily unavailable for maintenance
);

-- Lifecycle of a booking
CREATE TYPE booking_status AS ENUM (
  'pending',     -- Awaiting owner confirmation
  'confirmed',   -- Owner confirmed, pending pickup
  'active',      -- Tool is with the borrower
  'completed',   -- Tool returned successfully
  'cancelled'    -- Booking was cancelled
);

-- ---------------------------------------------------------------
-- 2. CATEGORIES (Lookup / Reference Table)
-- Normalized: tool category data stored once, referenced by FK
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(50),          -- Icon name for UI (e.g. lucide icon)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 3. USERS
-- Linked to Clerk via clerk_id (external identity provider ID)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  clerk_id    VARCHAR(255) NOT NULL UNIQUE, -- Clerk's userId (e.g., user_2abc...)
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  phone       VARCHAR(20),
  location    VARCHAR(255),                 -- General area / village / district
  avatar_url  VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 4. TOOLS
-- Core entity: agricultural tools listed by users (owners)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tools (
  id            BIGSERIAL PRIMARY KEY,
  owner_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   INT    NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,

  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  location      VARCHAR(255) NOT NULL,     -- Where tool is physically located
  price_per_day NUMERIC(10, 2) NOT NULL
                CHECK (price_per_day > 0), -- Price must be positive

  status        tool_status NOT NULL DEFAULT 'available',
  condition     VARCHAR(50)  NOT NULL
                CHECK (condition IN ('excellent', 'good', 'fair', 'poor'))
                DEFAULT 'good',

  image_url     VARCHAR(500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 5. BOOKINGS
-- A user (borrower) reserves a tool for a date range
-- Core transaction logic enforces no date overlaps
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id            BIGSERIAL PRIMARY KEY,
  tool_id       BIGINT NOT NULL REFERENCES tools(id) ON DELETE RESTRICT,
  borrower_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  CHECK (end_date > start_date),           -- End must be after start

  total_price   NUMERIC(10, 2) NOT NULL
                CHECK (total_price > 0),

  status        booking_status NOT NULL DEFAULT 'pending',
  notes         TEXT,                      -- Optional message from borrower

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- NOTE: "no self-booking" rule (owner cannot book own tool) is enforced
  -- by the trg_no_self_booking trigger below.
  -- PostgreSQL does NOT allow subqueries inside CHECK constraints (SQL:2003).
);

-- ---------------------------------------------------------------
-- 6. REVIEWS
-- One review per completed booking (enforced by UNIQUE on booking_id)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id           BIGSERIAL PRIMARY KEY,
  booking_id   BIGINT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id  BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tool_id      BIGINT NOT NULL REFERENCES tools(id) ON DELETE CASCADE,

  rating       SMALLINT NOT NULL
               CHECK (rating BETWEEN 1 AND 5),  -- Star rating 1–5
  comment      TEXT,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------
-- 7. INDEXES (Query Optimization)
-- ---------------------------------------------------------------

-- Search tools by location (most common filter)
CREATE INDEX IF NOT EXISTS idx_tools_location
  ON tools USING btree (location);

-- Filter tools by status (available / borrowed / reserved)
CREATE INDEX IF NOT EXISTS idx_tools_status
  ON tools USING btree (status);

-- Query bookings for a specific tool (availability check)
CREATE INDEX IF NOT EXISTS idx_bookings_tool_id
  ON bookings USING btree (tool_id);

-- Query all bookings made by a user ("My Bookings")
CREATE INDEX IF NOT EXISTS idx_bookings_borrower_id
  ON bookings USING btree (borrower_id);

-- Filter tools by category
CREATE INDEX IF NOT EXISTS idx_tools_category_id
  ON tools USING btree (category_id);

-- Filter tools by owner ("My Tools" page)
CREATE INDEX IF NOT EXISTS idx_tools_owner_id
  ON tools USING btree (owner_id);

-- Speed up date range overlap queries in booking validation
CREATE INDEX IF NOT EXISTS idx_bookings_dates
  ON bookings USING btree (tool_id, start_date, end_date);

-- ---------------------------------------------------------------
-- 8. VIEW: Tools with Aggregated Rating
-- Denormalized read model used by GET /api/tools
-- ---------------------------------------------------------------
CREATE OR REPLACE VIEW v_tools_with_rating AS
SELECT
  t.id,
  t.owner_id,
  t.category_id,
  t.name,
  t.description,
  t.location,
  t.price_per_day,
  t.status,
  t.condition,
  t.image_url,
  t.created_at,
  t.updated_at,
  c.name                        AS category_name,
  u.name                        AS owner_name,
  u.clerk_id                    AS owner_clerk_id,
  COALESCE(AVG(r.rating), 0)    AS rating,
  COUNT(r.id)                   AS review_count
FROM tools t
JOIN categories c ON c.id = t.category_id
JOIN users u      ON u.id = t.owner_id
LEFT JOIN reviews r ON r.tool_id = t.id
GROUP BY
  t.id, t.owner_id, t.category_id, t.name, t.description,
  t.location, t.price_per_day, t.status, t.condition,
  t.image_url, t.created_at, t.updated_at,
  c.name, u.name, u.clerk_id;

-- ---------------------------------------------------------------
-- 9. UPDATED_AT TRIGGER (Auto-update timestamps)
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------
-- 10. NO SELF-BOOKING TRIGGER
-- Enforces: a tool owner cannot book their own tool.
-- WHY a trigger and not a CHECK constraint?
--   PostgreSQL CHECK constraints cannot reference other tables
--   (subqueries are forbidden per SQL:2003 standard).
--   A BEFORE INSERT trigger runs inside the same transaction,
--   providing the same integrity guarantee.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_no_self_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id BIGINT;
BEGIN
  -- Look up who owns the tool being booked
  SELECT owner_id INTO v_owner_id
  FROM tools
  WHERE id = NEW.tool_id;

  -- Raise an error if the borrower is also the owner
  IF v_owner_id = NEW.borrower_id THEN
    RAISE EXCEPTION 'Self-booking not allowed: user % owns tool %',
      NEW.borrower_id, NEW.tool_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_self_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_no_self_booking();
