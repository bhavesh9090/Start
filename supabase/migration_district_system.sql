-- ==========================================
-- DISTRICT-BASED SYSTEM MIGRATION (COMPLETE & SAFE)
-- ==========================================

-- 1. Create Districts Table
CREATE TABLE IF NOT EXISTS districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert Initial Districts
INSERT INTO districts (name) VALUES 
('Almora'), ('Bageshwar'), ('Chamoli'), ('Champawat'), 
('Dehradun'), ('Haridwar'), ('Nainital'), ('Pauri Garhwal'), 
('Pithoragarh'), ('Rudraprayag'), ('Tehri Garhwal'), 
('Udham Singh Nagar'), ('Uttarkashi')
ON CONFLICT (name) DO NOTHING;

-- 3. Update Tables (Ensuring columns exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id);
ALTER TABLE admins ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id);
ALTER TABLE notices ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS district_id UUID REFERENCES districts(id);

-- 4. Create Tables (If they don't exist)
CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    district_id UUID REFERENCES districts(id), 
    created_by UUID REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    district_id UUID REFERENCES districts(id),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED')),
    admin_remarks TEXT,
    resolved_by UUID REFERENCES admins(id),
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Publication for Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 6. Add tables to realtime publication (Safe/Idempotent way)
DO $$
BEGIN
    -- Add monthly_payments
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'monthly_payments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE monthly_payments;
    END IF;

    -- Add notices
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notices'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notices;
    END IF;

    -- Add complaints
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'complaints'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE complaints;
    END IF;
END $$;

-- 7. Add RLS (Security)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Notices Policy: User sees their district's or global
DROP POLICY IF EXISTS "Users can view notices in their district" ON notices;
CREATE POLICY "Users can view notices in their district" ON notices
    FOR SELECT USING (
        district_id IS NULL OR 
        district_id IN (SELECT district_id FROM users WHERE id = auth.uid())
    );

-- Complaints Policies
DROP POLICY IF EXISTS "Users can manage their own complaints" ON complaints;
CREATE POLICY "Users can manage their own complaints" ON complaints
    FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage district complaints" ON complaints;
CREATE POLICY "Admins can manage district complaints" ON complaints
    FOR ALL USING (district_id IN (SELECT district_id FROM admins WHERE id = auth.uid()));

-- 8. Backfill existing users (Optional: Assigns first district to users without one)
UPDATE users SET district_id = (SELECT id FROM districts WHERE name = 'Almora' LIMIT 1) WHERE district_id IS NULL;
UPDATE admins SET district_id = (SELECT id FROM districts WHERE name = 'Almora' LIMIT 1) WHERE district_id IS NULL;
