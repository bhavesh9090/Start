-- ==========================================
-- PERSONAL NOTICES SYSTEM MIGRATION
-- ==========================================

-- 1. Add user_id to notices table
ALTER TABLE notices ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 2. Index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_notices_user_id ON notices(user_id);

-- 3. Note: district_id remains NULL for global notices (if any) or 
-- if specified for a whole district.
-- Personal notices should have BOTH district_id (admin's district) 
-- and user_id (target user).
