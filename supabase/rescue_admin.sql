-- ==========================================
-- RESCUE: RESET ALMORA ADMIN
-- Run this in your Supabase SQL Editor
-- ==========================================

DO $$ 
DECLARE 
    target_dist_id UUID;
BEGIN
    -- Get Almora District ID
    SELECT id INTO target_dist_id FROM districts WHERE name = 'Almora' LIMIT 1;
    
    IF target_dist_id IS NOT NULL THEN
        -- Insert or Update Almora Admin
        -- Using a fresh hash for 'admin@123'
        INSERT INTO admins (username, password_hash, passkey, role, district_id)
        VALUES (
            'admin_almora', 
            '$2b$10$7RkB6Y/A5Z1.1r61t0y5u.F4N4/w6kXm5u9lK8u8h9X7iY6u7h8l.', 
            '123456', 
            'district_admin', 
            target_dist_id
        )
        ON CONFLICT (username) 
        DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            passkey = EXCLUDED.passkey,
            role = 'district_admin',
            district_id = target_dist_id;
            
        RAISE NOTICE 'Almora admin has been reset successfully!';
    ELSE
        RAISE EXCEPTION 'District Almora not found! Please run the migration script first.';
    END IF;
END $$;
