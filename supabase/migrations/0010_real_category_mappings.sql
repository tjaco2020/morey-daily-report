-- =============================================================
-- 0010 — Replace demo category mappings with real RptCategory1 values
-- from Morey's product.product_tag table.
-- Display names cleaned up for executive readability. Edit any of these
-- via Supabase Table Editor or the Phase 7 admin UI later.
-- Safe to re-run (DELETE + re-INSERT).
-- =============================================================

delete from public.product_category_mappings;

insert into public.product_category_mappings
  (source_category, display_name, display_order) values
  -- Admissions (highest operational volume — show first)
  ('Admissions-Pier',                'Pier Admissions',           10),
  ('Admissions-Waterpark',           'Waterpark Admissions',      20),
  ('Admissions-Combo',               'Combo Admissions',          30),
  ('Admissions-Flexible',            'Flexible Admissions',       40),
  ('Admissions-Golf',                'Golf Admissions',           50),
  ('Admissions-Mirror Maze',         'Mirror Maze Admissions',    60),

  -- Passes
  ('Season Pass',                    'Season Pass',               70),
  ('Season Pass Waterpark Only',     'Season Pass (Waterpark)',   80),
  ('Parent Limited Ride Pass',       'Parent Pass',               90),

  -- Tickets / Groups
  ('Tickets',                        'Tickets',                  100),
  ('Group Sales',                    'Group Sales',              110),

  -- Extreme attractions
  ('Extreme-Skyscraper',             'Skyscraper',               120),
  ('Extreme-Spring Shot',            'Spring Shot',              130),
  ('Extreme-X2 Package',             'X2 Package',               140),

  -- Other revenue centers
  ('Tram Car',                       'Tram Car',                 150),
  ('Games',                          'Games',                    160),
  ('F&B',                            'Food & Beverage',          170),
  ('Gift Cards',                     'Gift Cards',               180),
  ('Laguna Oaks',                    'Laguna Oaks',              190),
  ('Trade',                          'Trade',                    200),

  -- Catch-all for any ticket not tagged with RptCategory1
  ('Uncategorized',                  'Uncategorized',            999);
