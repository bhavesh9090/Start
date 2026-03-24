-- ============================================================
-- FIX: Missing columns for Admin Meeting and Chat
-- ============================================================

-- 1. Add missing photo_url to admins table
ALTER TABLE admins 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Add missing columns to admin_messages table
ALTER TABLE admin_messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 3. Ensure admin_messages is enabled for Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'admin_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE admin_messages;
    END IF;
END $$;

-- 4. Ensure RLS is disabled or properly configured for admin_messages
-- (Since the app currently uses custom auth logic for messages)
ALTER TABLE admin_messages DISABLE ROW LEVEL SECURITY;
