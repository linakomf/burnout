-- Однократно выполните в Neon SQL Editor (или через psql -f neon_setup.sql).
-- Исправляет search_path и права на схему public (PostgreSQL 15+ / Neon).

CREATE SCHEMA IF NOT EXISTS public;

GRANT USAGE, CREATE ON SCHEMA public TO CURRENT_USER;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- Для всех новых подключений к этой БД:
DO $$
BEGIN
  EXECUTE format('ALTER DATABASE %I SET search_path TO public', current_database());
END $$;
