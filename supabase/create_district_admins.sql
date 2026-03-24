-- ==========================================
-- CREATE 13 DISTRICT ADMINS
-- Default Password: admin@123
-- Default Passkey: 123456
-- ==========================================

DO $$ 
DECLARE 
    dist_record RECORD;
    dummy_password_hash TEXT := '$2b$10$7RkB6Y/A5Z1.1r61t0y5u.F4N4/w6kXm5u9lK8u8h9X7iY6u7h8l.'; -- Hash for 'admin@123'
BEGIN
    FOR dist_record IN SELECT id, name FROM districts LOOP
        INSERT INTO admins (username, password_hash, passkey, role, district_id)
        VALUES (
            'admin_' || LOWER(REPLACE(dist_record.name, ' ', '_')), 
            dummy_password_hash, 
            '123456', 
            'district_admin', 
            dist_record.id
        )

        ON CONFLICT (username) DO NOTHING;
    END LOOP;
END $$;

-- Check the results
SELECT a.username, d.name as district_name 
FROM admins a 
JOIN districts d ON a.district_id = d.id;
