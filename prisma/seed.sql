-- Seed: the 12 administrative districts of Yerevan.
-- Run after the init migration:
--   psql "$DATABASE_URL" -f prisma/seed.sql
-- Idempotent: safe to run more than once.

INSERT INTO "districts" ("name_en", "name_hy", "slug") VALUES
  ('Ajapnyak',        'Աջափնյակ',         'ajapnyak'),
  ('Arabkir',         'Արաբկիր',           'arabkir'),
  ('Avan',            'Ավան',              'avan'),
  ('Davtashen',       'Դավթաշեն',          'davtashen'),
  ('Erebuni',         'Էրեբունի',          'erebuni'),
  ('Kanaker-Zeytun',  'Քանաքեռ-Զեյթուն',   'kanaker-zeytun'),
  ('Kentron',         'Կենտրոն',           'kentron'),
  ('Malatia-Sebastia','Մալաթիա-Սեբաստիա',  'malatia-sebastia'),
  ('Nor Nork',        'Նոր Նորք',          'nor-nork'),
  ('Nork-Marash',     'Նորք-Մարաշ',        'nork-marash'),
  ('Nubarashen',      'Նուբարաշեն',        'nubarashen'),
  ('Shengavit',       'Շենգավիթ',          'shengavit')
ON CONFLICT ("slug") DO NOTHING;
