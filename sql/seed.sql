-- =============================================================
-- ToolVerse Seed Data (for development / testing)
-- =============================================================

-- ---------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------
INSERT INTO categories (name, description, icon) VALUES
  ('Tractors',    'Motorized tractors for plowing and hauling',     'tractor'),
  ('Implements',  'Rotavators, plows, tillers, and attachments',    'wrench'),
  ('Irrigation',  'Water pumps, sprinklers, and drip systems',      'droplets'),
  ('Seeding',     'Seed drills, planters, and sowing equipment',    'leaf'),
  ('Harvesting',  'Combine harvesters, threshers, and reapers',     'wheat'),
  ('Spraying',    'Pesticide and fertilizer sprayers',              'spray-can'),
  ('Storage',     'Silos, bins, and grain storage equipment',       'box')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------
-- SAMPLE USERS
-- NOTE: Replace 'clerk_xxxx' with actual Clerk user IDs when testing.
--       These are placeholder IDs for seeding only.
-- ---------------------------------------------------------------
INSERT INTO users (clerk_id, name, email, phone, location) VALUES
  ('clerk_seed_user_001', 'Ramesh Singh',   'ramesh.singh@example.com',   '9876543210', 'Farm A, North District'),
  ('clerk_seed_user_002', 'Amit Kumar',     'amit.kumar@example.com',     '9812345678', 'Farm B, East District'),
  ('clerk_seed_user_003', 'Suresh Patel',   'suresh.patel@example.com',   '9823456789', 'Village Hub, Central'),
  ('clerk_seed_user_004', 'Vikram Sharma',  'vikram.sharma@example.com',  '9834567890', 'Farm C, West District'),
  ('clerk_seed_user_005', 'Priya Devi',     'priya.devi@example.com',     '9845678901', 'South Village, Dist. 5')
ON CONFLICT (clerk_id) DO NOTHING;

-- ---------------------------------------------------------------
-- SAMPLE TOOLS
-- ---------------------------------------------------------------
INSERT INTO tools (owner_id, category_id, name, description, location, price_per_day, status, condition, image_url)
SELECT
  u.id,
  c.id,
  t.name,
  t.description,
  t.location,
  t.price_per_day,
  t.status::tool_status,
  t.condition,
  t.image_url
FROM (VALUES
  ('clerk_seed_user_001', 'Tractors',    'John Deere 5050 D Tractor',
   'Powerful 50HP tractor suitable for plowing large fields.',
   'Farm A, North District', 1500, 'available', 'good',
   'https://images.unsplash.com/photo-1592982537447-6f23f6d7eb59?w=600'),

  ('clerk_seed_user_002', 'Implements',  'Heavy Duty Rotavator',
   '7-feet rotavator compatible with 40HP+ tractors.',
   'Farm B, East District', 500, 'borrowed', 'excellent',
   'https://images.unsplash.com/photo-1586524245648-52c6f3795ab6?w=600'),

  ('clerk_seed_user_003', 'Irrigation',  'Honda Water Pump 5HP',
   'Petrol-powered centrifugal pump, 3-inch outlet.',
   'Village Hub, Central', 300, 'reserved', 'good',
   'https://images.unsplash.com/photo-1563820227187-25e4fba6ea81?w=600'),

  ('clerk_seed_user_004', 'Seeding',     'Automatic Seed Drill',
   '9-row seed drill for wheat, rice, and soybean.',
   'Farm C, West District', 800, 'available', 'fair',
   'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=600'),

  ('clerk_seed_user_005', 'Harvesting',  'Mini Combine Harvester',
   'Compact harvester suitable for small to medium plots.',
   'South Village, Dist. 5', 2500, 'available', 'good',
   'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600')
) AS t(clerk_id, cat_name, name, description, location, price_per_day, status, condition, image_url)
JOIN users u      ON u.clerk_id = t.clerk_id
JOIN categories c ON c.name    = t.cat_name
ON CONFLICT DO NOTHING;
