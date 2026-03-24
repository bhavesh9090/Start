CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  is_edited BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Realtime Enable check
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'admin_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE admin_messages;
    END IF;
END $$;

-- 2. RLS disable for messages table (Kyunki custom auth hai)
ALTER TABLE admin_messages DISABLE ROW LEVEL SECURITY;

-- 3. STORAGE POLICIES
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'admin-chat-files');
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'admin-chat-files');
