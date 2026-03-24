-- ==========================================
-- ADMIN PROFILE SCHEMA UPDATE
-- ==========================================

ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS mobile TEXT,
ADD COLUMN IF NOT EXISTS qualification TEXT,
ADD COLUMN IF NOT EXISTS office_field TEXT,
ADD COLUMN IF NOT EXISTS member_since TEXT;

-- Update existing admins with some placeholders if needed, 
-- but usually they will fill it via the UI.
